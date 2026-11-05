// Web Audio engine: audio interface input -> effect chain -> chosen output, plus a clean tap for pitch detection.

import { chromaFromSpectrum, type Chroma } from "./chroma";
import { detectPitch, rmsOf } from "./pitch";

export type EffectId = "gate" | "drive" | "eq" | "chorus" | "delay" | "reverb";
export type InputChannel = "all" | "left" | "right";

export interface EffectState {
  enabled: boolean;
  /** 0..100 */
  amount: number;
}

export type EffectMap = Record<EffectId, EffectState>;

/** Effects the audio engine can build. Which of them are offered, in what order and with what default is database data. */
export const EFFECT_IDS: EffectId[] = ["gate", "drive", "eq", "chorus", "delay", "reverb"];

export function isEffectId(id: string): id is EffectId {
  return (EFFECT_IDS as string[]).includes(id);
}

export const DEFAULT_EFFECTS: EffectMap = {
  gate: { enabled: false, amount: 25 },
  drive: { enabled: false, amount: 50 },
  eq: { enabled: false, amount: 50 },
  chorus: { enabled: false, amount: 40 },
  delay: { enabled: false, amount: 35 },
  reverb: { enabled: false, amount: 40 },
};

export interface DeviceLists {
  inputs: MediaDeviceInfo[];
  outputs: MediaDeviceInfo[];
}

export async function listDevices(): Promise<DeviceLists> {
  const all = await navigator.mediaDevices.enumerateDevices();
  return {
    inputs: all.filter((d) => d.kind === "audioinput"),
    outputs: all.filter((d) => d.kind === "audiooutput"),
  };
}

/** Labels stay empty until the page has microphone permission, so ask once, then list. */
export async function requestAccessAndList(): Promise<DeviceLists> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((t) => t.stop());
  return listDevices();
}

interface Fx {
  input: AudioNode;
  output: AudioNode;
  setEnabled(on: boolean): void;
  setAmount(a: number): void;
}

function wrapFx(ctx: AudioContext, build: (wet: GainNode, out: GainNode) => (a: number) => void): Fx {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  wet.gain.value = 0;
  input.connect(dry);
  dry.connect(output);
  input.connect(wet);
  const setAmount = build(wet, output);
  return {
    input,
    output,
    setAmount,
    setEnabled(on) {
      const t = ctx.currentTime;
      dry.gain.setTargetAtTime(on ? 0 : 1, t, 0.015);
      wet.gain.setTargetAtTime(on ? 1 : 0, t, 0.015);
    },
  };
}

function driveCurve(k: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(n);
  const norm = Math.tanh(k);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(k * x) / norm;
  }
  return curve;
}

function impulse(ctx: AudioContext, seconds = 2.2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

export interface Sample {
  /** Input level in dBFS, -Infinity when silent. */
  db: number;
  hz: number | null;
  clarity: number;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  /** A second, finer analyser for hearing chords (many strings at once) */
  private chordAnalyser: AnalyserNode | null = null;
  private spectrum = new Float32Array(4096);
  private monitor: GainNode | null = null;
  private fx = new Map<EffectId, Fx>();
  private gateGain: GainNode | null = null;
  private gate: EffectState = { ...DEFAULT_EFFECTS.gate };
  private buf = new Float32Array(2048);
  private minHz = 70;
  private pitchFrame = 0;
  private lastPitch: { hz: number; clarity: number } | null = null;
  private lfo: OscillatorNode | null = null;

  get running(): boolean {
    return this.ctx !== null;
  }

  get canSelectOutput(): boolean {
    return typeof AudioContext !== "undefined" && "setSinkId" in AudioContext.prototype;
  }

  /** Round-trip estimate in ms (input is not reported by browsers, so this is output side only). */
  get latencyMs(): number | null {
    if (!this.ctx) return null;
    const out = (this.ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0;
    return Math.round((this.ctx.baseLatency + out) * 1000);
  }

  async start(opts: { inputId: string; outputId: string; channel: InputChannel; monitor: boolean; effects: EffectMap }): Promise<void> {
    await this.stop();
    const audio: MediaTrackConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2,
    };
    if (opts.inputId && opts.inputId !== "default") audio.deviceId = { exact: opts.inputId };
    const stream = await navigator.mediaDevices.getUserMedia({ audio });
    this.stream = stream;

    const ctx = new AudioContext({ latencyHint: "interactive" });
    this.ctx = ctx;
    if (opts.outputId && opts.outputId !== "default") await this.setOutput(opts.outputId);

    const source = ctx.createMediaStreamSource(stream);
    const mix = ctx.createGain();
    mix.channelCount = 1;
    mix.channelCountMode = "explicit";
    const split = ctx.createChannelSplitter(2);
    source.connect(split);
    this.connectChannel(split, mix, opts.channel);
    this.mixNode = mix;
    this.splitNode = split;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = this.buf.length;
    mix.connect(analyser);
    this.analyser = analyser;
    const chordAnalyser = ctx.createAnalyser();
    chordAnalyser.fftSize = 8192; // about 6 Hz per bin at 48 kHz: fine enough to tell neighbouring notes apart
    chordAnalyser.smoothingTimeConstant = 0.5;
    mix.connect(chordAnalyser);
    this.chordAnalyser = chordAnalyser;

    // Chain: gate -> drive -> eq -> chorus -> delay -> reverb -> monitor
    const gateGain = ctx.createGain();
    this.gateGain = gateGain;

    const drive = wrapFx(ctx, (wet, out) => {
      const pre = ctx.createGain();
      const shaper = ctx.createWaveShaper();
      const post = ctx.createGain();
      shaper.oversample = "4x";
      post.gain.value = 0.55;
      wet.connect(pre);
      pre.connect(shaper);
      shaper.connect(post);
      post.connect(out);
      return (a) => {
        const x = a / 100;
        shaper.curve = driveCurve(1 + x * 40);
        pre.gain.value = 1 + x * 3;
      };
    });

    const eq = wrapFx(ctx, (wet, out) => {
      const low = ctx.createBiquadFilter();
      const mid = ctx.createBiquadFilter();
      const high = ctx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 120;
      mid.type = "peaking";
      mid.frequency.value = 800;
      mid.Q.value = 0.9;
      high.type = "highshelf";
      high.frequency.value = 3200;
      wet.connect(low);
      low.connect(mid);
      mid.connect(high);
      high.connect(out);
      return (a) => {
        const x = (a - 50) / 50; // -1..1
        low.gain.value = 4 * x;
        mid.gain.value = -4 * x;
        high.gain.value = 9 * x;
      };
    });

    const chorus = wrapFx(ctx, (wet, out) => {
      const delay = ctx.createDelay(0.1);
      delay.delayTime.value = 0.022;
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 0.9;
      lfo.connect(depth);
      depth.connect(delay.delayTime);
      lfo.start();
      this.lfo = lfo;
      const mixGain = ctx.createGain();
      mixGain.gain.value = 0.8;
      wet.connect(delay);
      wet.connect(out);
      delay.connect(mixGain);
      mixGain.connect(out);
      return (a) => {
        depth.gain.value = 0.001 + (a / 100) * 0.006;
      };
    });

    const delayFx = wrapFx(ctx, (wet, out) => {
      const delay = ctx.createDelay(1.5);
      delay.delayTime.value = 0.36;
      const feedback = ctx.createGain();
      const level = ctx.createGain();
      wet.connect(out);
      wet.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(level);
      level.connect(out);
      return (a) => {
        feedback.gain.value = 0.1 + (a / 100) * 0.55;
        level.gain.value = 0.25 + (a / 100) * 0.5;
      };
    });

    const reverb = wrapFx(ctx, (wet, out) => {
      const conv = ctx.createConvolver();
      conv.buffer = impulse(ctx);
      const level = ctx.createGain();
      wet.connect(out);
      wet.connect(conv);
      conv.connect(level);
      level.connect(out);
      return (a) => {
        level.gain.value = (a / 100) * 0.9;
      };
    });

    const monitor = ctx.createGain();
    monitor.gain.value = opts.monitor ? 1 : 0;
    this.monitor = monitor;

    mix.connect(gateGain);
    gateGain.connect(drive.input);
    drive.output.connect(eq.input);
    eq.output.connect(chorus.input);
    chorus.output.connect(delayFx.input);
    delayFx.output.connect(reverb.input);
    reverb.output.connect(monitor);
    monitor.connect(ctx.destination);

    this.fx.set("drive", drive);
    this.fx.set("eq", eq);
    this.fx.set("chorus", chorus);
    this.fx.set("delay", delayFx);
    this.fx.set("reverb", reverb);

    (Object.keys(opts.effects) as EffectId[]).forEach((id) => this.setEffect(id, opts.effects[id]));
    await ctx.resume();
  }

  private mixNode: GainNode | null = null;
  private splitNode: ChannelSplitterNode | null = null;

  private connectChannel(split: ChannelSplitterNode, mix: GainNode, channel: InputChannel) {
    try {
      split.disconnect();
    } catch {
      /* not connected yet */
    }
    if (channel === "left") split.connect(mix, 0);
    else if (channel === "right") split.connect(mix, 1);
    else {
      split.connect(mix, 0);
      split.connect(mix, 1);
    }
  }

  setChannel(channel: InputChannel) {
    if (this.splitNode && this.mixNode) this.connectChannel(this.splitNode, this.mixNode, channel);
  }

  async setOutput(id: string): Promise<boolean> {
    const ctx = this.ctx as (AudioContext & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (!ctx?.setSinkId) return false;
    try {
      await ctx.setSinkId(id === "default" ? "" : id);
      return true;
    } catch {
      return false;
    }
  }

  setMonitor(on: boolean) {
    if (this.monitor && this.ctx) this.monitor.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.02);
  }

  setEffect(id: EffectId, s: EffectState) {
    if (id === "gate") {
      this.gate = { ...s };
      return;
    }
    const fx = this.fx.get(id);
    if (!fx) return;
    fx.setAmount(s.amount);
    fx.setEnabled(s.enabled);
  }

  /**
   * Lowest pitch the detector should look for. A bass low E (41 Hz) needs a longer analysis window than a guitar,
   * so low ranges use a bigger buffer (and look for pitch every other frame to keep the cost down).
   */
  setPitchRange(minHz: number): void {
    this.minHz = minHz;
    const size = minHz < 60 ? 4096 : 2048;
    if (this.buf.length !== size) this.buf = new Float32Array(size);
    if (this.analyser) this.analyser.fftSize = size;
  }

  /** Which pitch classes are sounding (for chord targets), or null when it is quiet. Call once per frame, only when playing chords. */
  chroma(): Chroma | null {
    if (!this.ctx || !this.chordAnalyser) return null;
    this.chordAnalyser.getFloatFrequencyData(this.spectrum as Float32Array<ArrayBuffer>);
    return chromaFromSpectrum(this.spectrum, this.ctx.sampleRate, this.chordAnalyser.fftSize);
  }

  /** Call once per frame: reads level + pitch from the clean input and drives the noise gate. */
  sample(): Sample | null {
    if (!this.ctx || !this.analyser) return null;
    this.analyser.getFloatTimeDomainData(this.buf as Float32Array<ArrayBuffer>);
    const rms = rmsOf(this.buf);
    const db = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

    if (this.gateGain) {
      const threshold = 0.002 + (this.gate.amount / 100) * 0.03;
      const open = !this.gate.enabled || rms > threshold;
      this.gateGain.gain.setTargetAtTime(open ? 1 : 0, this.ctx.currentTime, open ? 0.005 : 0.05);
    }

    if (rms < 0.012) return { db, hz: null, clarity: 0 };
    if (this.buf.length > 2048 && this.pitchFrame++ % 2 === 1) {
      const last = this.lastPitch;
      return { db, hz: last ? last.hz : null, clarity: last ? last.clarity : 0 };
    }
    const p = detectPitch(this.buf, this.ctx.sampleRate, this.minHz);
    this.lastPitch = p ? { hz: p.hz, clarity: p.clarity } : null;
    return { db, hz: p ? p.hz : null, clarity: p ? p.clarity : 0 };
  }

  async stop(): Promise<void> {
    this.lfo?.stop();
    this.lfo = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.ctx) await this.ctx.close();
    this.ctx = null;
    this.analyser = null;
    this.chordAnalyser = null;
    this.monitor = null;
    this.gateGain = null;
    this.mixNode = null;
    this.splitNode = null;
    this.fx.clear();
  }
}
