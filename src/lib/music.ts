// Music theory helpers. Which instruments and scales exist is data from the database (see catalog.ts).

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface Instrument {
  id: string;
  labelKey: string;
  available: boolean;
  /** MIDI note of each open string, lowest first. */
  tuning: number[];
  stringNames: string[];
  /** Photo path under /public, shown on the instrument picker */
  image: string | null;
  /** Photographer / source, listed in the picker footer */
  imageCredit: string | null;
}

export interface ScalePreset {
  id: string;
  instrumentId: string;
  labelKey: string;
  rootPc: number;
  intervals: number[];
  startFret: number;
}

export interface Pos {
  string: number;
  fret: number;
  midi: number;
  root: boolean;
}

/** Frets covered by one scale position. */
export const FRET_WINDOW = 4;

export function noteName(midi: number): string {
  const n = Math.round(midi);
  return NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
}

export function pitchClassName(midi: number): string {
  return NAMES[((Math.round(midi) % 12) + 12) % 12];
}

export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

/** Every fret position of the scale inside the window, one position per pitch (lowest string wins). */
export function scalePositions(scale: ScalePreset, instrument: Instrument): Pos[] {
  const seen = new Set<number>();
  const out: Pos[] = [];
  instrument.tuning.forEach((open, s) => {
    for (let f = scale.startFret; f < scale.startFret + FRET_WINDOW; f++) {
      const midi = open + f;
      const rel = (((midi - scale.rootPc) % 12) + 12) % 12;
      if (!scale.intervals.includes(rel) || seen.has(midi)) continue;
      seen.add(midi);
      out.push({ string: s, fret: f, midi, root: rel === 0 });
    }
  });
  return out.sort((a, b) => a.midi - b.midi);
}

/** Walks up the scale and back down, the way a practice run is played. */
export function walkSequence(positions: Pos[]): Pos[] {
  if (positions.length < 2) return positions;
  const down = positions.slice(1, -1).reverse();
  return [...positions, ...down];
}
