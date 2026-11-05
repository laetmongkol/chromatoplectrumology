"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Brand from "@/components/Brand";
import Fretboard from "@/components/Fretboard";
import Collapsible from "@/components/Collapsible";
import Dropdown from "@/components/Dropdown";
import { useLocalePath, useT } from "@/components/I18nProvider";
import ThemeToggle from "@/components/ThemeToggle";
import Toggle, { HeadphonesIcon, MetronomeIcon, NoteNamesIcon } from "@/components/Toggle";
import type { Catalog } from "@/lib/catalog";
import {
  AudioEngine,
  DEFAULT_EFFECTS,
  isEffectId,
  listDevices,
  type DeviceLists,
  type EffectId,
  type EffectMap,
  type EffectState,
  type InputChannel,
} from "@/lib/engine";
import { firstArrivalSeconds, Game, STAGE_H, STAGE_W, type Mode } from "@/lib/game";
import { Metronome } from "@/lib/metronome";
import { hzToMidi, noteName, scalePositions, walkSequence } from "@/lib/music";
import { StageRenderer, type StageLabels } from "@/lib/stage";
import { resolveTheme } from "@/lib/theme";

const KEY = "geetaaa.settings.v2";

interface Settings {
  inputId: string;
  outputId: string;
  channel: InputChannel;
  scaleId: string;
  bpm: number;
  mode: Mode;
  showNames: boolean;
  metronome: boolean;
  monitor: boolean;
  effects: EffectMap;
}

function baseEffects(catalog: Catalog): EffectMap {
  const map: EffectMap = { ...DEFAULT_EFFECTS };
  for (const fx of catalog.effects) {
    if (isEffectId(fx.id)) map[fx.id] = { enabled: false, amount: fx.defaultAmount };
  }
  return map;
}

function loadSettings(catalog: Catalog): Settings {
  const firstScale = catalog.scales.find((s) => s.id === catalog.settings.defaultScale) ?? catalog.scales[0];
  const defaults: Settings = {
    inputId: "default",
    outputId: "default",
    channel: "all",
    scaleId: firstScale?.id ?? "",
    bpm: catalog.settings.bpmDefault,
    mode: "beat",
    showNames: false,
    metronome: false,
    monitor: false,
    effects: baseEffects(catalog),
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Settings>;
      const merged = { ...defaults, ...p, effects: { ...defaults.effects, ...p.effects } };
      if (!catalog.scales.some((s) => s.id === merged.scaleId)) merged.scaleId = defaults.scaleId;
      merged.bpm = Math.max(catalog.settings.bpmMin, Math.min(catalog.settings.bpmMax, Number(merged.bpm) || defaults.bpm));
      return merged;
    }
  } catch {
    /* storage blocked or corrupt: use defaults */
  }
  return defaults;
}

function pop(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
}

interface Hud {
  score: number;
  combo: number;
  acc: number | null;
  hear: string;
  cents: number | null;
  db: number;
  target: string;
}

const NO_STRINGS: string[] = [];
const HUD0: Hud = { score: 0, combo: 0, acc: null, hear: "–", cents: null, db: -Infinity, target: "" };

export default function Practice({ catalog, instrumentId, authSlot, langSlot }: { catalog: Catalog; instrumentId: string; authSlot: ReactNode; langSlot: ReactNode }) {
  const t = useT();
  const path = useLocalePath();
  const [s, setS] = useState<Settings>(() => loadSettings(catalog));
  const [devices, setDevices] = useState<DeviceLists>({ inputs: [], outputs: [] });
  const [engineOn, setEngineOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hud, setHud] = useState<Hud>(HUD0);
  const [tuner, setTuner] = useState(false);
  const [cam, setCam] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  // which sections are folded away; every section starts open on each visit
  const [folded, setFolded] = useState<Record<string, boolean>>({});
  const isOpen = (id: string) => folded[id] !== true;
  const toggleSec = (id: string) => setFolded((prev) => ({ ...prev, [id]: prev[id] !== true }));

  const engineRef = useRef<AudioEngine>(new AudioEngine());
  const gameRef = useRef<Game>(new Game());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lvlRef = useRef<HTMLElement>(null);
  const scoreRef = useRef<HTMLElement>(null);
  const comboRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const camStream = useRef<MediaStream | null>(null);
  const showNamesRef = useRef(s.showNames);
  const metronomeRef = useRef<Metronome | null>(null);
  const metroCfg = useRef({ bpm: s.bpm, mode: s.mode });
  const labelsRef = useRef<StageLabels>({ good: "", perfect: "", miss: "", combo: () => "" });

  const instrument = catalog.instruments.find((i) => i.id === instrumentId) ?? catalog.instruments[0];
  const scaleList = useMemo(() => catalog.scales.filter((x) => x.instrumentId === instrument?.id), [catalog.scales, instrument?.id]);
  const scale = scaleList.find((x) => x.id === s.scaleId) ?? scaleList[0];
  const positions = useMemo(() => (scale && instrument ? scalePositions(scale, instrument) : []), [scale, instrument]);
  const stringNames = instrument?.stringNames ?? NO_STRINGS;

  const describeError = useCallback(
    (err: unknown): string => {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError") return t("err.denied");
      if (name === "NotFoundError") return t("err.notFound");
      if (name === "OverconstrainedError") return t("err.overconstrained");
      return t("err.generic");
    },
    [t],
  );

  // stage labels follow the current language
  useEffect(() => {
    labelsRef.current = {
      good: t("stage.good"),
      perfect: t("stage.perfect"),
      miss: t("stage.miss"),
      combo: (n) => t("stage.combo", { n }),
    };
  }, [t]);

  // persist settings
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* storage blocked */
    }
  }, [s]);

  // push lesson settings into the game
  useEffect(() => {
    gameRef.current.setSequence(walkSequence(positions));
  }, [positions]);
  useEffect(() => {
    gameRef.current.bpm = s.bpm;
    gameRef.current.mode = s.mode;
    showNamesRef.current = s.showNames;
    metroCfg.current = { bpm: s.bpm, mode: s.mode };
    metronomeRef.current?.setBpm(s.bpm);
  }, [s.bpm, s.mode, s.showNames]);

  // metronome clicks while a run is going and the box is ticked; in "on beat" mode the first click lands when the first note reaches the line
  useEffect(() => {
    const m = (metronomeRef.current ??= new Metronome());
    if (running && s.metronome) {
      const { bpm, mode } = metroCfg.current;
      m.start(bpm, mode === "beat" ? firstArrivalSeconds(bpm) : 0.3);
    } else {
      m.stop();
    }
  }, [running, s.metronome]);
  useEffect(() => {
    return () => {
      void metronomeRef.current?.dispose();
    };
  }, []);

  // device list (labels appear once permission is granted)
  useEffect(() => {
    const refresh = () => {
      listDevices().then(setDevices, () => undefined);
    };
    refresh();
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    return () => navigator.mediaDevices.removeEventListener("devicechange", refresh);
  }, []);

  // main loop: listen, judge, draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = gameRef.current;
    const e = engineRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new StageRenderer(canvas, stringNames, reduce, () => labelsRef.current, () => resolveTheme() === "dark");
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let heardMidi: number | null = null;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const smp = e.sample();
      const heard = smp && smp.hz ? { midi: hzToMidi(smp.hz), clarity: smp.clarity } : null;
      heardMidi = heard ? heard.midi : null;
      const events = g.update(dt, heard);
      if (events.length) {
        renderer.handle(events);
        if (events.some((x) => x.type === "hit")) {
          pop(scoreRef.current);
          pop(comboRef.current);
        }
      }
      renderer.draw(g, showNamesRef.current);
      if (lvlRef.current) {
        const db = smp ? smp.db : -Infinity;
        lvlRef.current.style.width = `${Math.max(0, Math.min(100, ((db + 60) / 60) * 100))}%`;
      }
      acc += dt;
      if (acc > 0.1) {
        acc = 0;
        const tgt = g.notes.find((n) => n.state === "pending");
        setHud({
          score: g.score,
          combo: g.combo,
          acc: g.accuracy,
          hear: heardMidi === null ? "–" : noteName(heardMidi),
          cents: heardMidi === null ? null : Math.round((heardMidi - Math.round(heardMidi)) * 100),
          db: smp ? smp.db : -Infinity,
          target: tgt ? `${tgt.string}:${tgt.fret}` : "",
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stringNames]);

  // release hardware on leave
  useEffect(() => {
    const e = engineRef.current;
    return () => {
      void e.stop();
      camStream.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const startEngine = useCallback(
    async (settings: Settings) => {
      setError(null);
      try {
        await engineRef.current.start({
          inputId: settings.inputId,
          outputId: settings.outputId,
          channel: settings.channel,
          monitor: settings.monitor,
          effects: settings.effects,
        });
        setEngineOn(true);
        setLatency(engineRef.current.latencyMs);
        setDevices(await listDevices());
      } catch (err) {
        setEngineOn(false);
        setError(describeError(err));
      }
    },
    [describeError],
  );

  const ensureEngine = useCallback(async () => {
    if (!engineRef.current.running) await startEngine(s);
    return engineRef.current.running;
  }, [s, startEngine]);

  const onStart = async () => {
    if (!(await ensureEngine())) return;
    const g = gameRef.current;
    if (g.running) {
      g.running = false;
      setRunning(false);
    } else {
      g.reset();
      g.running = true;
      setRunning(true);
    }
  };

  const onTune = async () => {
    if (!tuner && !(await ensureEngine())) return;
    setTuner((v) => !v);
  };

  const patch = (p: Partial<Settings>) => setS((prev) => ({ ...prev, ...p }));

  const onInput = (id: string) => {
    patch({ inputId: id });
    if (engineRef.current.running) void startEngine({ ...s, inputId: id });
  };
  const onOutput = (id: string) => {
    patch({ outputId: id });
    if (engineRef.current.running) void engineRef.current.setOutput(id);
  };
  const onChannel = (c: InputChannel) => {
    patch({ channel: c });
    engineRef.current.setChannel(c);
  };
  const onMonitor = (on: boolean) => {
    patch({ monitor: on });
    engineRef.current.setMonitor(on);
  };
  const onEffect = (id: EffectId, change: Partial<EffectState>) => {
    const next = { ...s.effects[id], ...change };
    patch({ effects: { ...s.effects, [id]: next } });
    engineRef.current.setEffect(id, next);
  };

  const stopCam = () => {
    camStream.current?.getTracks().forEach((tr) => tr.stop());
    camStream.current = null;
    setCam(false);
  };
  const toggleCam = async () => {
    if (cam) return stopCam();
    try {
      camStream.current = await navigator.mediaDevices.getUserMedia({ video: true });
      setCam(true);
    } catch {
      setError(t("err.camera"));
    }
  };
  useEffect(() => {
    if (cam && videoRef.current && camStream.current) videoRef.current.srcObject = camStream.current;
  }, [cam]);

  const defaultLabel = t("audio.systemDefault");
  const inputOptions = [{ deviceId: "default", label: defaultLabel }, ...devices.inputs.filter((d) => d.deviceId !== "default")];
  const outputOptions = [{ deviceId: "default", label: defaultLabel }, ...devices.outputs.filter((d) => d.deviceId !== "default")];
  const canOut = typeof AudioContext !== "undefined" && "setSinkId" in AudioContext.prototype;
  const inputDd = inputOptions.map((d, i) => ({ value: d.deviceId, label: d.label || t("audio.inputN", { n: i }) }));
  const outputDd = outputOptions.map((d, i) => ({ value: d.deviceId, label: d.label || t("audio.outputN", { n: i }) }));
  const channelDd = [
    { value: "all", label: t("audio.channel.all") },
    { value: "left", label: t("audio.channel.left") },
    { value: "right", label: t("audio.channel.right") },
  ];
  const scaleDd = scaleList.map((x) => ({ value: x.id, label: t(x.labelKey) }));
  const cents = hud.cents;
  const openNotes = (instrument?.tuning ?? []).map((m) => noteName(m)).join(" ");
  const effectRows = catalog.effects.filter((fx) => isEffectId(fx.id));

  return (
    <>
      <div className="navbar">
        <div className="wrap">
          <header className="top flat">
            <span className="logo">
              <Brand name={t("site.name")} />
            </span>
            <Link href={path("/app")}>{t("app.instrument.title")}</Link>
            {authSlot}
            <Link href={path("/")}>{t("nav.site")}</Link>
            {langSlot}
            <ThemeToggle />
          </header>
        </div>
      </div>
      <div className="wrap">
        <h1 className="app-h1" style={{ whiteSpace: "pre-line" }}>
          {t("app.title")}
        </h1>
        <p className="lead">{t("app.lead")}</p>

        <div className="cols">
        <Collapsible id="audio" title={t("audio.title")} hint={t("audio.hint")} open={isOpen("audio")} onToggle={() => toggleSec("audio")}>
          <div className="row">
            <div className="f">
              <span id="lbl-in">{t("audio.input")}</span>
              <Dropdown labelledBy="lbl-in" value={s.inputId} options={inputDd} onChange={onInput} />
            </div>
            <div className="f">
              <span id="lbl-ch">{t("audio.channel")}</span>
              <Dropdown labelledBy="lbl-ch" value={s.channel} options={channelDd} onChange={(v) => onChannel(v as InputChannel)} />
            </div>
            <div className="f">
              <span id="lbl-out">{t("audio.output")}</span>
              <Dropdown labelledBy="lbl-out" value={s.outputId} options={outputDd} onChange={onOutput} disabled={!canOut} />
            </div>
          </div>
          <div className="ctrl-grid">
            <button type="button" className={`ctrl${engineOn ? " on" : ""}`} aria-pressed={engineOn} onClick={() => (engineOn ? undefined : void startEngine(s))}>
              {engineOn ? t("audio.connected") : t("audio.connect")}
            </button>
            <Toggle checked={s.monitor} onChange={onMonitor} label={t("audio.monitor")} stateText={s.monitor ? t("common.on") : t("common.off")} icon={<HeadphonesIcon />} />
          </div>
          <div className="meterline">
            <span>{t("audio.level")}</span>
            <div className="bar">
              <i ref={lvlRef as React.RefObject<HTMLElement>} />
            </div>
            <span>{Number.isFinite(hud.db) ? `${Math.round(hud.db)} dB` : "–"}</span>
          </div>
          <p className="note">
            {latency !== null ? `${t("audio.latency", { ms: latency })} ` : ""}
            {canOut ? "" : `${t("audio.noOutputSelect")} `}
            {t("audio.cleanSignal")}
          </p>
          {error && <p className="err">{error}</p>}
        </Collapsible>

        <Collapsible id="lesson" title={t("lesson.title")} open={isOpen("lesson")} onToggle={() => toggleSec("lesson")}>
          <div className="row">
            <div className="f">
              <span id="lbl-scale">{t("lesson.scale")}</span>
              <Dropdown labelledBy="lbl-scale" value={scale?.id ?? ""} options={scaleDd} onChange={(v) => patch({ scaleId: v })} />
            </div>
            <label className="f" htmlFor="spd">
              {t("lesson.speed", { bpm: s.bpm })}
              <input
                id="spd"
                type="range"
                min={catalog.settings.bpmMin}
                max={catalog.settings.bpmMax}
                value={s.bpm}
                onChange={(e) => patch({ bpm: Number(e.target.value) })}
              />
            </label>
          </div>
          {/* four controls of the same size in a 2 x 2 grid: judging mode on the first row, switches on the second */}
          <div className="ctrl-grid">
            <button type="button" className={`ctrl${s.mode === "beat" ? " on" : ""}`} aria-pressed={s.mode === "beat"} onClick={() => patch({ mode: "beat" })}>
              {t("lesson.onBeat")}
            </button>
            <button type="button" className={`ctrl${s.mode === "free" ? " on" : ""}`} aria-pressed={s.mode === "free"} onClick={() => patch({ mode: "free" })}>
              {t("lesson.wait")}
            </button>
            <Toggle checked={s.showNames} onChange={(v) => patch({ showNames: v })} label={t("lesson.names")} stateText={s.showNames ? t("common.on") : t("common.off")} icon={<NoteNamesIcon />} />
            <Toggle
              checked={s.metronome}
              onChange={(v) => patch({ metronome: v })}
              label={t("lesson.metronome")}
              stateText={s.metronome ? t("common.on") : t("common.off")}
              icon={<MetronomeIcon />}
              style={{ "--beat": `${60 / s.bpm}s` } as React.CSSProperties}
            />
          </div>
        </Collapsible>
        </div>
      </div>

      <div className="stage">
        <div className="in">
          <canvas ref={canvasRef} width={STAGE_W} height={STAGE_H} aria-label={t("stage.aria")} />
          <aside className="side">
            <div className="hearing">
              {t("stage.hearing")} {hud.hear}
              {cents !== null ? ` ${cents > 0 ? "+" : ""}${cents}¢` : ""}
            </div>
            <div className="stats">
              <div>
                <small>{t("stats.score")}</small>
                <b ref={scoreRef}>{hud.score}</b>
              </div>
              <div>
                <small>{t("stats.combo")}</small>
                <b ref={comboRef}>{hud.combo}</b>
              </div>
              <div>
                <small>{t("stats.accuracy")}</small>
                <b>{hud.acc === null ? "–" : `${hud.acc}%`}</b>
              </div>
            </div>
            <div className="side-controls">
              <button className="pill on" onClick={() => void onStart()}>
                {running ? t("stage.stop") : t("stage.start")}
              </button>
              <button className="pill" aria-pressed={tuner} onClick={() => void onTune()}>
                {tuner ? t("stage.closeTuner") : t("stage.tune")}
              </button>
            </div>
          </aside>
        </div>
      </div>

      <div className="wrap">

        {tuner && (
          <section className="sec" style={{ marginTop: 36 }}>
            <h2>
              {t("tuner.title")} <span>{t("tuner.hint")}</span>
            </h2>
            <div className="tuner">
              <span className="big">{hud.hear}</span>
              <div className="needle" aria-hidden="true">
                <i style={{ left: `${50 + Math.max(-50, Math.min(50, cents ?? 0))}%`, opacity: cents === null ? 0.2 : 1 }} />
              </div>
              <span className="note">
                {cents === null
                  ? t("tuner.waiting")
                  : Math.abs(cents) <= 5
                    ? t("tuner.inTune")
                    : cents > 0
                      ? t("tuner.sharp", { c: cents })
                      : t("tuner.flat", { c: -cents })}
              </span>
              <span className="note">{t("tuner.open", { notes: openNotes })}</span>
            </div>
          </section>
        )}

        <div style={{ marginTop: 36 }}>
        <Collapsible id="fret" title={t("fret.title")} hint={t("fret.hint")} open={isOpen("fret")} onToggle={() => toggleSec("fret")}>
          <div className="two">
            <div className="fretwrap">
              {scale && instrument && <Fretboard scale={scale} instrument={instrument} target={hud.target} label={t("fret.aria", { scale: t(scale.labelKey) })} />}
            </div>
            <div className="camcol">
              <div className="cam">{cam ? <video ref={videoRef} autoPlay muted playsInline /> : <span>{t("camera.label")}</span>}</div>
              <button className={`pill sm${cam ? " on" : ""}`} aria-pressed={cam} onClick={() => void toggleCam()}>
                {cam ? t("camera.off") : t("camera.on")}
              </button>
            </div>
          </div>
        </Collapsible>

        <Collapsible id="tone" title={t("tone.title")} hint={t("tone.hint")} open={isOpen("tone")} onToggle={() => toggleSec("tone")}>
          <div className="fx">
            {effectRows.map((fx) => {
              const id = fx.id as EffectId;
              const st = s.effects[id];
              return (
                <div className="r" key={fx.id}>
                  <b>{t(fx.labelKey)}</b>
                  <input
                    type="range"
                    aria-label={t(fx.labelKey)}
                    min={0}
                    max={100}
                    value={st.amount}
                    onChange={(e) => onEffect(id, { amount: Number(e.target.value) })}
                  />
                  <button className={`pill sm${st.enabled ? " on" : ""}`} aria-pressed={st.enabled} onClick={() => onEffect(id, { enabled: !st.enabled })}>
                    {st.enabled ? t("common.on") : t("common.off")}
                  </button>
                </div>
              );
            })}
          </div>
        </Collapsible>
        </div>

        <footer className="app-foot">
          {t("site.name")}
          <br />
          {t("app.foot")}
        </footer>
      </div>
    </>
  );
}
