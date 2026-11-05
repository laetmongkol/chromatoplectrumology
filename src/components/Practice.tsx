"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { savePlay } from "@/app/play-actions";
import Fretboard from "@/components/Fretboard";
import Collapsible from "@/components/Collapsible";
import Dropdown from "@/components/Dropdown";
import { useT } from "@/components/I18nProvider";
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
import ChordBoard from "@/components/ChordBoard";
import { formatChordLine } from "@/lib/chords";
import { chordTargets, soloScale, type SongPlay } from "@/lib/songtime";
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
  /** Notes judged so far (hit or missed), used to show which chord is next in a song */
  judged: number;
  /** Beat the song is at (0 = first beat on the hit line) */
  beat: number;
}

const NO_STRINGS: string[] = [];
const HUD0: Hud = { score: 0, combo: 0, acc: null, hear: "–", cents: null, db: -Infinity, target: "", judged: 0, beat: -8 };

type SongMode = "chords" | "roots" | "solo";

export default function Practice({ catalog, instrumentId, songs = [], initialSongSlug }: { catalog: Catalog; instrumentId: string; songs?: SongPlay[]; initialSongSlug?: string }) {
  const t = useT();
  const [s, setS] = useState<Settings>(() => loadSettings(catalog));
  const [devices, setDevices] = useState<DeviceLists>({ inputs: [], outputs: [] });
  const [engineOn, setEngineOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  // what is being practised: a scale (no song chosen) or a song, played as strummed chords, root notes, or a solo over the chords
  const [songSlug, setSongSlug] = useState(() => (songs.some((x) => x.slug === initialSongSlug) ? (initialSongSlug as string) : ""));
  const [songMode, setSongMode] = useState<SongMode>("chords");
  // True plays the chords as written; Easy uses the hand-written easy sheet, or simplifies the True chords (C13b9 -> C7, C/E -> C)
  const [chordType, setChordType] = useState<"true" | "easy">("true");
  const chosen = songs.find((x) => x.slug === songSlug);
  const song = useMemo(() => {
    if (!chosen || chordType === "true") return chosen;
    const simple = (c: string) => formatChordLine(c, { type: "easy", notation: "written", shift: 0, flats: false });
    return { ...chosen, steps: chosen.stepsEasy ?? chosen.steps.map((st) => ({ ...st, chord: simple(st.chord) })) };
  }, [chosen, chordType]);
  const startedAtRef = useRef(0);
  const songModeRef = useRef(false);
  // set below to a function that ends the run; kept in a ref so the animation loop always calls the latest one
  const finishRef = useRef<() => void>(() => {});
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
  const soloPreset = useMemo(() => (song && instrument ? soloScale(song.songKey, instrument.tuning, scale) : undefined), [song, instrument, scale]);
  const soloPositions = useMemo(() => (soloPreset && instrument ? scalePositions(soloPreset, instrument) : []), [soloPreset, instrument]);
  // the scale fretboard shows the lesson scale, or the song's key when soloing
  const boardScale = song && songMode === "solo" ? soloPreset : scale;
  // listen for pitches down to a little below the lowest open string (bass needs a lower floor than guitar)
  const lowestMidi = instrument && instrument.tuning.length > 0 ? Math.min(...instrument.tuning) : 40;
  useEffect(() => {
    engineRef.current.setPitchRange(Math.max(25, 440 * 2 ** ((lowestMidi - 69) / 12) * 0.85));
  }, [lowestMidi]);

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

  useEffect(() => {
    songModeRef.current = !!song && songMode === "chords";
  }, [song, songMode]);

  // push lesson settings into the game
  useEffect(() => {
    const g = gameRef.current;
    g.endAtBeat = null;
    if (song && instrument && songMode !== "solo") {
      // a song plays through once, in its own rhythm: a strum (or just the root note) for each chord
      g.loop = false;
      g.setSequence(chordTargets(song.steps, instrument.tuning, songMode === "chords"));
    } else if (song && instrument) {
      // solo: scale notes in the song's key, one a beat, until the song ends
      g.loop = true;
      g.endAtBeat = song.totalBeats;
      g.setSequence(walkSequence(soloPositions));
    } else {
      g.loop = true;
      g.setSequence(walkSequence(positions));
    }
  }, [positions, song, songMode, instrument, soloPositions]);
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
      const events = g.update(dt, heard, songModeRef.current && g.running ? e.chroma() : null);
      if (events.length) {
        renderer.handle(events);
        if (events.some((x) => x.type === "hit")) {
          pop(scoreRef.current);
          pop(comboRef.current);
        }
      }
      renderer.draw(g, showNamesRef.current);
      if (g.running && g.done) finishRef.current();
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
          judged: g.total,
          beat: g.songBeat,
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

  // Ends the run and keeps it: the server saves it for a signed-in player and says so otherwise.
  useEffect(() => {
    finishRef.current = () => {
      const g = gameRef.current;
      g.running = false;
      setRunning(false);
      const now = new Date();
      const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      void savePlay({
        instrumentId,
        scaleId: song ? `song:${song.slug}:${songMode}` : s.scaleId,
        mode: s.mode,
        bpm: s.bpm,
        score: g.score,
        bestCombo: g.best,
        hits: g.hits,
        total: g.total,
        seconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        day,
      })
        .then((r) => setSaveMsg(r.ok ? t("play.points", { score: r.score, pts: r.points }) : r.reason === "login" ? t("play.login") : r.reason === "short" ? t("play.short") : ""))
        .catch(() => setSaveMsg(""));
    };
  });

  const onStart = async () => {
    if (!(await ensureEngine())) return;
    const g = gameRef.current;
    if (g.running) {
      finishRef.current();
    } else {
      g.reset();
      g.running = true;
      startedAtRef.current = Date.now();
      setSaveMsg("");
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
            {songs.length > 0 && (
              <div className="f">
                <span id="lbl-song">{t("practice.what")}</span>
                <Dropdown
                  labelledBy="lbl-song"
                  value={songSlug}
                  options={[{ value: "", label: t("practice.scale") }, ...songs.map((x) => ({ value: x.slug, label: x.title }))]}
                  onChange={(v) => {
                    setSongSlug(v);
                    const picked = songs.find((x) => x.slug === v);
                    // the song brings its own speed
                    if (picked) patch({ bpm: Math.max(catalog.settings.bpmMin, Math.min(catalog.settings.bpmMax, picked.bpm)), mode: "beat" });
                  }}
                />
              </div>
            )}
            {song && (
              <div className="f">
                <span id="lbl-type">{t("songs.chordType")}</span>
                <Dropdown
                  labelledBy="lbl-type"
                  value={chordType}
                  options={[
                    { value: "true", label: t("songs.type.true") },
                    { value: "easy", label: t("songs.type.easy") },
                  ]}
                  onChange={(v) => setChordType(v === "easy" ? "easy" : "true")}
                />
              </div>
            )}
            {song ? (
              <div className="f">
                <span id="lbl-mode">{t("practice.how")}</span>
                <Dropdown
                  labelledBy="lbl-mode"
                  value={songMode}
                  options={[
                    { value: "chords", label: t("practice.mode.chords") },
                    { value: "roots", label: t("practice.mode.roots") },
                    { value: "solo", label: t("practice.mode.solo") },
                  ]}
                  onChange={(v) => setSongMode(v as SongMode)}
                />
              </div>
            ) : (
              <div className="f">
                <span id="lbl-scale">{t("lesson.scale")}</span>
                <Dropdown labelledBy="lbl-scale" value={scale?.id ?? ""} options={scaleDd} onChange={(v) => patch({ scaleId: v })} />
              </div>
            )}
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

      {song && (
        <div className="wrap">
          <SongStrip song={song} beat={hud.beat} running={running} mode={songMode} />
        </div>
      )}
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
            {saveMsg && (
              <p className="note" role="status" style={{ margin: "10px 0 0" }}>
                {saveMsg}
              </p>
            )}
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
              {song && songMode !== "solo" && instrument?.tuning.length === 6 ? (
                (() => {
                  const cur = currentStep(song, hud.beat);
                  const nxt = song.steps[cur.index + 1];
                  return <ChordBoard chord={cur.step.chord} next={nxt?.chord} label={cur.step.chord} />;
                })()
              ) : (
                boardScale &&
                instrument && <Fretboard scale={boardScale} instrument={instrument} target={hud.target} label={t("fret.aria", { scale: song ? song.title : t(boardScale.labelKey) })} />
              )}
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

/** The song step that is current at this beat (the last one that has started). */
function currentStep(song: SongPlay, beat: number): { step: SongPlay["steps"][number]; index: number } {
  let index = 0;
  for (let i = 0; i < song.steps.length; i++) {
    if (song.steps[i].at <= beat + 0.25) index = i;
    else break;
  }
  return { step: song.steps[index], index };
}

/** The chord to play now and the ones coming up, with the lyric line they sit above. Shown only when playing a song. */
function SongStrip({ song, beat, running, mode }: { song: SongPlay; beat: number; running: boolean; mode: SongMode }) {
  const t = useT();
  const finished = beat >= song.totalBeats;
  const { step: now, index } = currentStep(song, beat);
  const upcoming = song.steps.slice(index + 1, index + 5);
  const bar = Math.max(0, Math.floor(beat / song.beatsPerBar)) + 1;
  const bars = Math.round(song.totalBeats / song.beatsPerBar);
  return (
    <section className="mb-6 rounded-2xl border border-[var(--line)] p-5" aria-live="off">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div>
          <p className="m-0 font-mono text-xs uppercase text-[var(--muted)]">{finished ? t("songs.finished") : running ? t("songs.now") : song.title}</p>
          <p className="m-0 text-5xl font-light leading-none">{finished ? "✓" : (now?.chord ?? "")}</p>
        </div>
        <div className="flex gap-3 font-mono text-lg text-[var(--muted)]" aria-hidden="true">
          {upcoming.map((st, i) => (
            <span key={`${index}-${i}`}>{st.chord}</span>
          ))}
        </div>
        {running && !finished && (
          <p className="m-0 ml-auto font-mono text-xs text-[var(--muted)]">
            {t("songs.bar", { n: Math.min(bar, bars), total: bars })}
          </p>
        )}
      </div>
      {!finished && now?.lyric && <p className="mb-0 mt-3 text-[var(--muted)]">{now.lyric}</p>}
      {!running && !finished && <p className="mb-0 mt-3 text-sm text-[var(--muted)]">{mode === "chords" ? t("songs.strum.hint") : mode === "roots" ? t("songs.roots.hint") : t("songs.solo.hint")}</p>}
    </section>
  );
}
