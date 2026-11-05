// Guitar chord shapes: which fret to press on each string (low E to high e). null = do not play that string, 0 = open.

import { parseChord } from "./chords";

export type Shape = (number | null)[];

type Q = "maj" | "m" | "7" | "m7" | "maj7" | "sus4" | "sus2";

/** Open-position shapes, by root pitch class and quality. */
const OPEN: Record<string, Shape> = {
  "0:maj": [null, 3, 2, 0, 1, 0],
  "0:7": [null, 3, 2, 3, 1, 0],
  "0:maj7": [null, 3, 2, 0, 0, 0],
  "2:maj": [null, null, 0, 2, 3, 2],
  "2:m": [null, null, 0, 2, 3, 1],
  "2:7": [null, null, 0, 2, 1, 2],
  "2:m7": [null, null, 0, 2, 1, 1],
  "2:maj7": [null, null, 0, 2, 2, 2],
  "2:sus4": [null, null, 0, 2, 3, 3],
  "2:sus2": [null, null, 0, 2, 3, 0],
  "4:maj": [0, 2, 2, 1, 0, 0],
  "4:m": [0, 2, 2, 0, 0, 0],
  "4:7": [0, 2, 0, 1, 0, 0],
  "4:m7": [0, 2, 0, 0, 0, 0],
  "4:maj7": [0, 2, 1, 1, 0, 0],
  "4:sus4": [0, 2, 2, 2, 0, 0],
  "5:maj7": [null, null, 3, 2, 1, 0],
  "7:maj": [3, 2, 0, 0, 0, 3],
  "7:7": [3, 2, 0, 0, 0, 1],
  "7:maj7": [3, 2, 0, 0, 0, 2],
  "9:maj": [null, 0, 2, 2, 2, 0],
  "9:m": [null, 0, 2, 2, 1, 0],
  "9:7": [null, 0, 2, 0, 2, 0],
  "9:m7": [null, 0, 2, 0, 1, 0],
  "9:maj7": [null, 0, 2, 1, 2, 0],
  "9:sus4": [null, 0, 2, 2, 3, 0],
  "9:sus2": [null, 0, 2, 2, 0, 0],
  "11:7": [null, 2, 1, 2, 0, 2],
};

/** Movable shapes: the root is on the low E string (E shape) or the A string (A shape); add the fret of the root to every number. */
const E_SHAPE: Record<Q, Shape> = {
  maj: [0, 2, 2, 1, 0, 0],
  m: [0, 2, 2, 0, 0, 0],
  "7": [0, 2, 0, 1, 0, 0],
  m7: [0, 2, 0, 0, 0, 0],
  maj7: [0, 2, 1, 1, 0, 0],
  sus4: [0, 2, 2, 2, 0, 0],
  sus2: [0, 2, 4, 4, 0, 0],
};
const A_SHAPE: Record<Q, Shape> = {
  maj: [null, 0, 2, 2, 2, 0],
  m: [null, 0, 2, 2, 1, 0],
  "7": [null, 0, 2, 0, 2, 0],
  m7: [null, 0, 2, 0, 1, 0],
  maj7: [null, 0, 2, 1, 2, 0],
  sus4: [null, 0, 2, 2, 3, 0],
  sus2: [null, 0, 2, 2, 0, 0],
};

/** Reduces any chord quality to one of the shapes above (F#m9 -> m7, Cadd9 -> maj, C13b9 -> 7 ...). */
function canonical(q: string): Q {
  if (/^sus2/.test(q)) return "sus2";
  if (/^sus/.test(q)) return "sus4";
  if (/^(maj|M|Δ)/.test(q)) return /^(maj|M|Δ)(7|9|11|13)/.test(q) ? "maj7" : "maj";
  if (/^(m|min|dim)/.test(q)) return /(7|9|11|13)/.test(q) ? "m7" : "m";
  if (/^(7|9|11|13)/.test(q)) return "7";
  return "maj";
}

/** A playable guitar shape for a chord name, or null when the name is not a chord. */
export function chordShape(name: string): Shape | null {
  const c = parseChord(name);
  if (!c) return null;
  const q = canonical(c.quality);
  const open = OPEN[`${c.rootPc}:${q}`];
  if (open) return open;
  const rE = (((c.rootPc - 4) % 12) + 12) % 12;
  const rA = (((c.rootPc - 9) % 12) + 12) % 12;
  const [base, r] = rE <= rA ? [E_SHAPE[q], rE] : [A_SHAPE[q], rA];
  return base.map((f) => (f === null ? null : f + r));
}
