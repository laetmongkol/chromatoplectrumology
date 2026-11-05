"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatChordLine, parseChart, rowSegments } from "@/lib/chords";
import { songTimeline } from "@/lib/songtime";

interface SongRow {
  id: number;
  slug: string;
  title: string;
  artist: string;
  songKey: string;
  bpm: number | null;
  beatsPerBar: number;
  body: string;
  bodyEasy: string;
  published: boolean;
  sheets: { instrumentId: string; body: string; bodyEasy: string }[];
}

const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2.5 text-[15px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; dot?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-[var(--hover)] p-1" role="tablist">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-all ${value === it.id ? "bg-[var(--paper)] font-medium shadow-sm ring-1 ring-[var(--line)]" : "text-[var(--muted)]"}`}
        >
          {it.label}
          {it.dot && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-[#e8742c] align-middle" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

/**
 * Add or edit one song. The song has a default sheet, and optionally one sheet per instrument (guitar chords, a bass line ...);
 * each sheet has a True and an Easy version. A timing summary shows the song's length so the rhythm can be checked before saving.
 */
export default function SongEditor({ song, instruments, save, remove }: { song: SongRow | null; instruments: string[]; save: (f: FormData) => Promise<void>; remove: (f: FormData) => Promise<void> }) {
  const [inst, setInst] = useState<string>(""); // "" = default sheet
  const [level, setLevel] = useState<"true" | "easy">("true");
  const [bpm, setBpm] = useState(String(song?.bpm ?? 80));
  const [beats, setBeats] = useState(String(song?.beatsPerBar ?? 4));
  const [problem, setProblem] = useState("");
  // text of every sheet, keyed "<instrument>|true" or "<instrument>|easy" (instrument "" = default)
  const [text, setText] = useState<Record<string, string>>(() => {
    const t: Record<string, string> = { "|true": song?.body ?? "", "|easy": song?.bodyEasy ?? "" };
    for (const s of song?.sheets ?? []) {
      t[`${s.instrumentId}|true`] = s.body;
      t[`${s.instrumentId}|easy`] = s.bodyEasy;
    }
    return t;
  });
  const get = (i: string, l: string) => text[`${i}|${l}`] ?? "";
  const setOne = (i: string, l: string, v: string) => setText((p) => ({ ...p, [`${i}|${l}`]: v }));

  const easyIsAuto = get(inst, "easy").trim() === "";
  // what the preview shows: the chosen instrument's sheet, or the default one when that instrument has none
  const trueText = get(inst, "true").trim() !== "" ? get(inst, "true") : get("", "true");
  const shown = level === "easy" && !easyIsAuto ? get(inst, "easy") : trueText;
  const sections = useMemo(() => parseChart(shown), [shown]);
  const timing = useMemo(() => songTimeline(parseChart(trueText), Number(beats) || 4), [trueText, beats]);
  const seconds = (timing.totalBeats * 60) / (Number(bpm) || 80);
  const opts = { type: level === "easy" && easyIsAuto ? ("easy" as const) : ("true" as const), notation: "written" as const, shift: 0, flats: false };

  const names = ["", ...instruments];
  const filled = (i: string) => get(i, "true").trim() !== "" || get(i, "easy").trim() !== "";

  return (
    <div className="grid gap-6">
      <form
        action={save}
        className="grid gap-6 rounded-2xl border border-[var(--line)] p-6"
        onSubmit={(e) => {
          // the True sheet for "All instruments" is required; if it is empty, show it instead of failing silently
          if (get("", "true").trim() === "") {
            e.preventDefault();
            setInst("");
            setLevel("true");
            setProblem("Write the True chord sheet under All (default) first.");
          } else setProblem("");
        }}
      >
        {song && <input type="hidden" name="id" value={song.id} />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-xl font-normal">{song ? `Edit: ${song.title}` : "Add a song"}</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input name="published" type="checkbox" defaultChecked={song?.published ?? false} className="size-5 accent-[var(--ink)]" />
            Published
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input name="title" type="text" required defaultValue={song?.title ?? ""} className={input} />
          </Field>
          <Field label="Artist">
            <input name="artist" type="text" defaultValue={song?.artist ?? ""} className={input} />
          </Field>
          <Field label="Key" hint="The key of the sheet, e.g. Bb or Em. Used for solo and scale practice.">
            <input name="songKey" type="text" defaultValue={song?.songKey ?? ""} className={input} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="BPM" hint="Speed of the song">
              <input name="bpm" type="number" min={20} max={300} value={bpm} onChange={(e) => setBpm(e.target.value)} className={input} />
            </Field>
            <Field label="Beats per bar" hint="4 = 4/4, 3 = waltz">
              <input name="beatsPerBar" type="number" min={1} max={12} value={beats} onChange={(e) => setBeats(e.target.value)} className={input} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Address" hint="Letters, numbers and dashes. Made from the title when empty.">
              <input name="slug" type="text" defaultValue={song?.slug ?? ""} className={input} />
            </Field>
          </div>
        </div>

        <div className="grid gap-3">
          <p className="m-0 font-mono text-[11px] uppercase tracking-wide text-[var(--muted)]">Instrument</p>
          <Tabs value={inst} onChange={setInst} items={names.map((n) => ({ id: n, label: n === "" ? "All (default)" : cap(n), dot: n !== "" && filled(n) }))} />
          <Tabs
            value={level}
            onChange={setLevel}
            items={[
              { id: "true", label: "True chords" },
              { id: "easy", label: "Easy chords", dot: !easyIsAuto },
            ]}
          />
          {/* every sheet stays in the form; only the chosen one is shown */}
          {names.map((n) =>
            (["true", "easy"] as const).map((l) => (
              <textarea
                key={`${n}|${l}`}
                name={n === "" ? (l === "true" ? "body" : "bodyEasy") : l === "true" ? `sheet_${n}` : `sheetEasy_${n}`}
                rows={16}
                value={get(n, l)}
                onChange={(e) => setOne(n, l, e.target.value)}
                spellCheck={false}
                placeholder={n === "" && l === "true" ? "Verse\n| C   G | Am  F |\nFirst line of words" : ""}
                className={`${input} font-mono text-sm leading-relaxed ${n === inst && l === level ? "" : "hidden"}`}
              />
            )),
          )}
          <p className="m-0 text-xs text-[var(--muted)]">
            {inst !== ""
              ? `Leave empty to use the default sheet for ${inst}. Write a different sheet (for example a bass line) to give ${inst} players their own.`
              : level === "true"
                ? "A title line, then chord lines with the lyric line under each. Bars (|) set the rhythm: chords in one bar share its beats, and [x2] after a line repeats it. Only add songs you have the right to publish."
                : easyIsAuto
                  ? "Empty: Easy is made automatically from the True chords (C13b9 becomes C7, slash chords lose their bass note). Type here to write it by hand."
                  : "Hand-written Easy sheet. Visitors who pick Easy see this one."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[var(--hover)] px-4 py-3 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--muted)]">Timing</span>
          <span>{Math.round(timing.totalBeats / (Number(beats) || 4))} bars</span>
          <span>{timing.totalBeats} beats</span>
          <span>
            {mmss(seconds)} at {Number(bpm) || 80} BPM
          </span>
          <span className="text-[var(--muted)]">{timing.steps.length} chord changes</span>
        </div>

        {problem && (
          <p role="alert" className="m-0 rounded-xl border border-[var(--ink)] px-4 py-3 text-sm">
            {problem}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button className="pill on">{song ? "Save changes" : "Add song"}</button>
          {song && (
            <Link className="pill" href="/admin/songs">
              Cancel
            </Link>
          )}
        </div>
      </form>

      <section className="rounded-2xl border border-[var(--line)] p-6">
        <h3 className="m-0 mb-4 font-mono text-xs font-normal uppercase text-[var(--muted)]">
          Preview: {inst === "" ? "All" : cap(inst)} · {level === "true" ? "True" : easyIsAuto ? "Easy (automatic)" : "Easy (hand-written)"}
        </h3>
        {sections.length === 0 ? (
          <p className="m-0 text-sm text-[var(--muted)]">Nothing to show yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((s, i) => (
              <div key={i} className="rounded-xl border border-[var(--line)] p-4">
                {s.title && <p className="m-0 mb-3 inline-block rounded-full bg-[var(--hover)] px-2.5 py-0.5 font-mono text-[11px] uppercase text-[var(--muted)]">{s.title}</p>}
                <div className="grid gap-3 text-[15px]">
                  {s.rows.map((r, k) =>
                    r.chords === null ? (
                      <p key={k} className="m-0">
                        {r.lyric}
                      </p>
                    ) : (
                      <div key={k} className="flex flex-wrap items-end gap-y-1">
                        {rowSegments(r.chords, r.lyricRaw, (c) => formatChordLine(c, opts)).map((sg, n) => (
                          <span key={n} className="inline-flex flex-col">
                            <span className="flex h-7 items-center gap-1 whitespace-nowrap">
                              {sg.bar && <span className="mr-1 h-4 w-px bg-[var(--line)]" aria-hidden="true" />}
                              {sg.chord && <span className="rounded-md bg-[color-mix(in_srgb,#e8742c_14%,transparent)] px-1.5 font-mono text-sm font-semibold text-[#e8742c]">{sg.chord}</span>}
                            </span>
                            <span className="min-h-[1.2em] whitespace-pre-wrap pr-1.5 leading-snug">{sg.text}</span>
                          </span>
                        ))}
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {song && (
        <form action={remove} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] p-5">
          <input type="hidden" name="id" value={song.id} />
          <p className="m-0 text-sm text-[var(--muted)]">Delete this song for good. Points already earned stay.</p>
          <button className="pill sm">Delete</button>
        </form>
      )}
    </div>
  );
}
