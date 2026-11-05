// Turns a chord sheet into a timeline, so a song is played in its own rhythm.
//
// Rules, kept simple so an admin only has to paste the sheet:
//   - a bar is whatever sits between two "|" marks, and lasts `beatsPerBar` beats;
//   - chords in one bar share it equally ("| G D |" = two chords of two beats in 4/4);
//   - a line followed by [x2] (or (x2), x2) is played twice, and so on;
//   - a bar with no chord is skipped; a line without any "|" gives every chord a bar of its own.

import { chordRootPc, chordTones, isChordToken, type Section } from "./chords";
import type { Pos, ScalePreset } from "./music";

export interface TimedChord {
  chord: string;
  /** The lyric line printed under the chord line this chord belongs to. */
  lyric: string | null;
  /** Where the chord starts, in beats from the start of the song. */
  at: number;
  /** How long it lasts, in beats. */
  beats: number;
}

/** What the practice room needs to play a song. */
export interface SongPlay {
  id: number;
  slug: string;
  title: string;
  songKey: string;
  bpm: number;
  beatsPerBar: number;
  steps: TimedChord[];
  /** The hand-written Easy sheet's chords, or null when the song has none (Easy is then made from `steps`). */
  stepsEasy: TimedChord[] | null;
  /** Length of the whole song in beats */
  totalBeats: number;
}

const REPEAT = /\[x(\d+)\]|\(x(\d+)\)|(?:^|\s)x(\d+)(?=\s|$)/i;

/** The bars of one chord line, and how many times the line is played. */
export function barsOfLine(line: string): { bars: string[][]; repeat: number } {
  let repeat = 1;
  const m = REPEAT.exec(line);
  let text = line;
  if (m) {
    repeat = Math.max(1, Math.min(16, Number(m[1] ?? m[2] ?? m[3])));
    text = line.replace(REPEAT, " ");
  }
  const chordsIn = (piece: string) => piece.split(/\s+/).filter((tk) => tk !== "" && isChordToken(tk));
  if (!text.includes("|")) return { bars: chordsIn(text).map((c) => [c]), repeat };
  return { bars: text.split("|").map(chordsIn).filter((b) => b.length > 0), repeat };
}

export function songTimeline(sections: Section[], beatsPerBar: number): { steps: TimedChord[]; totalBeats: number } {
  const bpb = Math.max(1, Math.min(12, Math.round(beatsPerBar) || 4));
  const steps: TimedChord[] = [];
  let at = 0;
  for (const sec of sections) {
    for (const row of sec.rows) {
      if (row.chords === null) continue;
      const { bars, repeat } = barsOfLine(row.chords);
      for (let r = 0; r < repeat; r++) {
        for (const bar of bars) {
          const each = bpb / bar.length;
          bar.forEach((chord, i) => steps.push({ chord, lyric: row.lyric, at: at + i * each, beats: each }));
          at += bpb;
        }
      }
    }
  }
  return { steps, totalBeats: at };
}

export function buildSongPlay(row: { id: number; slug: string; title: string; songKey: string; bpm: number | null; beatsPerBar: number }, sections: Section[], easySections: Section[] | null = null): SongPlay {
  const { steps, totalBeats } = songTimeline(sections, row.beatsPerBar);
  const easy = easySections ? songTimeline(easySections, row.beatsPerBar).steps : [];
  return { id: row.id, slug: row.slug, title: row.title, songKey: row.songKey, bpm: row.bpm ?? 80, beatsPerBar: row.beatsPerBar, steps, stepsEasy: easy.length > 0 ? easy : null, totalBeats };
}

/** Root and mode of a key name such as "Bb" or "Em". Returns null when it cannot be read. */
export function keyInfo(songKey: string): { rootPc: number; minor: boolean } | null {
  const m = /^([A-G])([#b]?)(m|min)?$/.exec(songKey.trim());
  if (!m) return null;
  const base = [9, 11, 0, 2, 4, 5, 7]["ABCDEFG".indexOf(m[1])];
  return { rootPc: (base + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + 12) % 12, minor: !!m[3] };
}

/**
 * One target per chord, timed to its beat: the chord's root on the low E string (or the A string when it is further than seven frets up).
 * With `strum` on, each target also carries the chord's tones, so the player has to sound the whole chord; off, it is just the root note.
 */
export function chordTargets(steps: TimedChord[], tuning: number[], strum: boolean): Pos[] {
  const out: Pos[] = [];
  for (const st of steps) {
    const pc = chordRootPc(st.chord);
    if (pc === null || tuning.length === 0) continue;
    const onE = (((pc - tuning[0]) % 12) + 12) % 12;
    const s = onE > 7 && tuning.length > 1 ? 1 : 0;
    const fret = (((pc - tuning[s]) % 12) + 12) % 12;
    out.push({ string: s, fret, midi: tuning[s] + fret, root: true, at: st.at, label: st.chord, ...(strum ? { pcs: chordTones(st.chord) ?? [pc] } : {}) });
  }
  return out;
}

/** A pentatonic box in the song's key, for soloing over the chords. Falls back to the given scale when the key cannot be read. */
export function soloScale(songKey: string, tuning: number[], fallback: ScalePreset | undefined): ScalePreset | undefined {
  const k = keyInfo(songKey);
  if (!k || tuning.length === 0) return fallback;
  const rootFret = (((k.rootPc - tuning[0]) % 12) + 12) % 12;
  return {
    id: "song-solo",
    instrumentId: fallback?.instrumentId ?? "",
    labelKey: fallback?.labelKey ?? "",
    rootPc: k.rootPc,
    intervals: k.minor ? [0, 3, 5, 7, 10] : [0, 2, 4, 7, 9],
    startFret: rootFret,
  };
}
