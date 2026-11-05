"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { practiceSong } from "@/app/play-actions";
import ChordDiagram from "@/components/ChordDiagram";
import { useT } from "@/components/I18nProvider";
import { formatChordLine, isChordToken, parseChart, prefersFlats, rowSegments, type ChordType, type Notation } from "@/lib/chords";

type Layout = "full" | "compact" | "two";

interface Tools {
  size: number;
  sectionName: boolean;
  layout: Layout;
  type: ChordType;
  notation: Notation;
  shift: number;
}

const DEFAULTS: Tools = { size: 20, sectionName: true, layout: "full", type: "true", notation: "written", shift: 0 };
const KEY = "geetaaa.sheet.v1";

function load(): Tools {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Tools>), shift: 0 } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

/** Joined buttons where the chosen one is raised, like a segmented control. */
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 rounded-xl bg-[var(--hover)] p-1" role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-w-0 flex-1 truncate rounded-lg px-2 py-2 text-sm transition-all duration-300 ${value === o.id ? "bg-[var(--paper)] font-medium text-[var(--ink)] shadow-sm ring-1 ring-[var(--line)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stepper({ label, value, onMinus, onPlus }: { label: ReactNode; value: ReactNode; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <span className="inline-flex items-center rounded-xl bg-[var(--hover)] p-1">
        <button type="button" aria-label="-" className="grid size-8 place-items-center rounded-lg text-lg hover:bg-[var(--paper)]" onClick={onMinus}>
          −
        </button>
        <span className="min-w-10 text-center font-mono text-sm">{value}</span>
        <button type="button" aria-label="+" className="grid size-8 place-items-center rounded-lg text-lg hover:bg-[var(--paper)]" onClick={onPlus}>
          +
        </button>
      </span>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <p className="m-0 font-mono text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      {children}
    </div>
  );
}

/** A chord sheet shown as cards, with a Tools card: font size, section names, layout, chord type (true / easy / lyrics), notation and key. */
export default function SongSheet({ songId, variants, songKey, playHref }: { songId: number; variants: { instrumentId: string; body: string; bodyEasy: string }[]; songKey: string; playHref: string }) {
  const t = useT();
  const [tools, setTools] = useState<Tools>(DEFAULTS);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [msg, setMsg] = useState("");
  // a song can have its own sheet per instrument (guitar chords, a bass line ...); the first variant is the default
  const [which, setWhich] = useState(0);
  const { body, bodyEasy } = variants[Math.min(which, variants.length - 1)];
  const loaded = useRef(false);

  // saved choices are read after mount so the server and first client render agree
  useEffect(() => {
    const saved = load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTools(saved);
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...tools, shift: 0 }));
    } catch {
      /* storage blocked */
    }
  }, [tools]);

  useEffect(() => {
    if (!toolsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToolsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toolsOpen]);

  // Easy uses the hand-written easy sheet when the admin gave one; otherwise it is made from the True sheet
  const handEasy = tools.type === "easy" && bodyEasy.trim() !== "";
  const sections = useMemo(() => parseChart(handEasy ? bodyEasy : body), [handEasy, bodyEasy, body]);
  const flats = useMemo(() => prefersFlats(body), [body]);
  const set = (p: Partial<Tools>) => setTools((prev) => ({ ...prev, ...p }));
  // +/- buttons work from the latest value, so quick repeated clicks all count
  const bump = (key: "size" | "shift", d: number, lo: number, hi: number) => setTools((prev) => ({ ...prev, [key]: Math.max(lo, Math.min(hi, prev[key] + d)) }));

  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    refs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [sections, tools.layout]);

  const fmt = (tok: string) => formatChordLine(tok, { type: handEasy ? "true" : tools.type, notation: tools.notation, shift: tools.shift, flats });
  const compact = tools.layout === "compact";
  // every different chord of the song, in the order it first appears, spelled the way the sheet below shows it
  const used = useMemo(() => {
    const seen = new Set<string>();
    for (const sec of sections) {
      for (const row of sec.rows) {
        if (row.chords === null) continue;
        for (const tk of row.chords.split(/\s+/)) {
          const bare = tk.replace(/^\|+|\|+$/g, "");
          if (bare && isChordToken(bare)) seen.add(fmt(bare));
        }
      }
    }
    return [...seen];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, tools.type, tools.notation, tools.shift, flats, handEasy]);

  const practice = async () => {
    const now = new Date();
    const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const r = await practiceSong(songId, day);
    setMsg(r.ok ? t("songs.practice.done", { n: r.points }) : r.reason === "login" ? t("songs.practice.login") : t("songs.practice.again"));
  };

  const toolsCard = (
    <div className="grid gap-6 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6">
      <div className="flex items-center justify-between pr-10">
        <h2 className="m-0 text-lg font-normal">{t("songs.tools")}</h2>
        <button type="button" className="linkbtn text-sm underline" onClick={() => setTools(DEFAULTS)}>
          {t("songs.reset")}
        </button>
      </div>
      <Group label={t("songs.chordType")}>
        <Segmented
          value={tools.type}
          onChange={(v) => set({ type: v })}
          options={[
            { id: "true", label: t("songs.type.true") },
            { id: "easy", label: t("songs.type.easy") },
            { id: "lyrics", label: t("songs.type.lyrics") },
          ]}
        />
      </Group>
      <Group label={t("songs.layout")}>
        <Segmented
          value={tools.layout}
          onChange={(v) => set({ layout: v })}
          options={[
            { id: "full", label: t("songs.layout.full") },
            { id: "compact", label: t("songs.layout.compact") },
            { id: "two", label: t("songs.layout.two") },
          ]}
        />
      </Group>
      <Group label={t("songs.notation")}>
        <Segmented
          value={tools.notation}
          onChange={(v) => set({ notation: v })}
          options={[
            { id: "written", label: t("songs.notation.written") },
            { id: "simple", label: t("songs.notation.simple") },
          ]}
        />
      </Group>
      <Stepper label={t("songs.fontSize")} value={tools.size} onMinus={() => bump("size", -1, 12, 32)} onPlus={() => bump("size", 1, 12, 32)} />
      <Stepper
        label={
          <>
            {t("songs.transpose")} {songKey && <span className="text-[var(--muted)]">({songKey})</span>}
          </>
        }
        value={tools.shift > 0 ? `+${tools.shift}` : tools.shift}
        onMinus={() => bump("shift", -1, -11, 11)}
        onPlus={() => bump("shift", 1, -11, 11)}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">{t("songs.sectionName")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={tools.sectionName}
          aria-label={t("songs.sectionName")}
          onClick={() => set({ sectionName: !tools.sectionName })}
          className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${tools.sectionName ? "bg-[var(--ink)]" : "bg-[var(--line)]"}`}
        >
          <span className={`absolute top-1 size-5 rounded-full bg-[var(--paper)] transition-all duration-300 ${tools.sectionName ? "left-6" : "left-1"}`} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[150px_minmax(0,1fr)]">
      <nav aria-label={t("songs.sections")} className="sticky top-24 hidden self-start lg:block">
        <ul className="m-0 list-none border-l border-[var(--line)] p-0">
          {sections.map((s, i) => (
            <li key={i}>
              <a
                href={`#sec-${i}`}
                className={`-ml-px block border-l py-1.5 pl-4 text-sm no-underline transition-colors ${i === active ? "border-[var(--ink)] text-[var(--ink)]" : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`}
                onClick={(e) => {
                  e.preventDefault();
                  refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {s.title || "·"}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {variants.length > 1 && (
            <span className="inline-flex gap-1 rounded-full bg-[var(--hover)] p-1" role="group" aria-label={t("songs.instrument")}>
              {variants.map((v, i) => (
                <button
                  key={v.instrumentId}
                  type="button"
                  aria-pressed={which === i}
                  onClick={() => setWhich(i)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-all ${which === i ? "bg-[var(--paper)] font-medium shadow-sm ring-1 ring-[var(--line)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                >
                  {v.instrumentId === "" ? t("songs.instrument.all") : t(`instrument.${v.instrumentId}`)}
                </button>
              ))}
            </span>
          )}
          <Link className="pill on" href={playHref}>
            {t("songs.play")}
          </Link>
          <button type="button" className="pill" onClick={() => void practice()}>
            {t("songs.practice")}
          </button>
          <button type="button" className="pill" aria-haspopup="dialog" aria-expanded={toolsOpen} onClick={() => setToolsOpen(true)}>
            {t("songs.tools")}
          </button>
          {msg && (
            <span role="status" className="text-sm text-[var(--muted)]">
              {msg}
            </span>
          )}
        </div>

        {tools.type !== "lyrics" && used.length > 0 && (
          <section className="mb-4 rounded-2xl border border-[var(--line)] p-6">
            <h2 className="mb-4 mt-0 inline-block rounded-full bg-[var(--hover)] px-3 py-1 font-mono text-[11px] font-normal uppercase tracking-wide text-[var(--muted)]">{t("songs.chords")}</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-x-3 gap-y-5">
              {used.map((c) => (
                <ChordDiagram key={c} chord={c} />
              ))}
            </div>
          </section>
        )}
        <div className={`grid gap-4 ${tools.layout === "two" ? "md:grid-cols-2" : ""}`} style={{ fontSize: tools.size }}>
          {sections.map((s, i) => (
            <section
              key={i}
              id={`sec-${i}`}
              data-i={i}
              ref={(el) => void (refs.current[i] = el)}
              className={`scroll-mt-24 rounded-2xl border border-[var(--line)] ${compact ? "p-4" : "p-6"}`}
            >
              {tools.sectionName && s.title && (
                <h2 className="mb-4 mt-0 inline-block rounded-full bg-[var(--hover)] px-3 py-1 font-mono text-[11px] font-normal uppercase tracking-wide text-[var(--muted)]">{s.title}</h2>
              )}
              <div className={`grid ${compact ? "gap-2" : "gap-4"}`}>
                {s.rows.map((r, k) => {
                  if (tools.type === "lyrics" || r.chords === null) {
                    return r.lyric ? (
                      <p key={k} className="m-0 leading-snug">
                        {r.lyric}
                      </p>
                    ) : null;
                  }
                  const segs = rowSegments(r.chords, r.lyricRaw, fmt);
                  return (
                    <div key={k} className="flex flex-wrap items-end gap-y-1">
                      {segs.map((sg, n) => (
                        <span key={n} className="inline-flex flex-col">
                          <span className="flex h-[1.9em] items-center gap-1.5 whitespace-nowrap">
                            {sg.bar && <span className="mr-1 h-[1.1em] w-px bg-[var(--line)]" aria-hidden="true" />}
                            {sg.chord && <span className="rounded-md bg-[color-mix(in_srgb,#e8742c_14%,transparent)] px-1.5 font-mono text-[0.92em] font-semibold text-[#e8742c]">{sg.chord}</span>}
                          </span>
                          <span className="min-h-[1.3em] whitespace-pre-wrap pr-1.5 leading-snug">{sg.text}</span>
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {toolsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4" onClick={() => setToolsOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={t("songs.tools")} className="state-pop relative w-full max-w-md bg-[var(--paper)] text-[var(--ink)]" onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="Close" className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full text-xl hover:bg-[var(--hover)]" onClick={() => setToolsOpen(false)}>
              ×
            </button>
            {toolsCard}
          </div>
        </div>
      )}
    </div>
  );
}
