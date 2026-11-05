// Hearing a chord: which pitch classes are sounding right now, from the spectrum of the input.
//
// Many strings ring at once, so the one-note pitch detector cannot be used. Instead the spectrum is searched for peaks, peaks that are
// just overtones of a lower peak are thrown away (a single note must not look like a chord), and what is left is counted per pitch class.

export type Chroma = Float32Array; // 12 shares that add up to 1, index 0 = C

const MIN_HZ = 70;
const MAX_HZ = 1000;
/** Peaks more than this far below the loudest peak are ignored. */
const FLOOR_DB = 24;

const hzToPc = (hz: number): number => {
  const midi = 69 + 12 * Math.log2(hz / 440);
  return ((Math.round(midi) % 12) + 12) % 12;
};

/**
 * `db` is the analyser's frequency data (decibels per bin). Returns null when nothing clear is sounding.
 */
export function chromaFromSpectrum(db: Float32Array, sampleRate: number, fftSize: number): Chroma | null {
  const binHz = sampleRate / fftSize;
  const lo = Math.max(2, Math.floor(MIN_HZ / binHz));
  const hi = Math.min(db.length - 2, Math.ceil(MAX_HZ / binHz));

  let top = -Infinity;
  for (let i = lo; i <= hi; i++) if (db[i] > top) top = db[i];
  if (!Number.isFinite(top) || top < -75) return null;

  // local maxima, with the true peak position refined from the neighbours (parabolic interpolation)
  const peaks: { hz: number; amp: number }[] = [];
  for (let i = lo; i <= hi; i++) {
    const v = db[i];
    if (v < top - FLOOR_DB || v < db[i - 1] || v <= db[i + 1]) continue;
    const a = db[i - 1];
    const c = db[i + 1];
    const denom = a - 2 * v + c;
    const shift = denom === 0 ? 0 : (0.5 * (a - c)) / denom;
    peaks.push({ hz: (i + shift) * binHz, amp: 10 ** (v / 20) });
  }
  if (peaks.length === 0) return null;
  peaks.sort((x, y) => x.hz - y.hz);

  // keep a peak unless it sits at a whole-number multiple of a lower, stronger kept peak
  const kept: { hz: number; amp: number }[] = [];
  for (const p of peaks) {
    const overtone = kept.some((k) => {
      if (k.amp < p.amp) return false;
      const ratio = p.hz / k.hz;
      const n = Math.round(ratio);
      return n >= 2 && n <= 8 && Math.abs(ratio - n) / n < 0.03;
    });
    if (!overtone) kept.push(p);
  }

  const out = new Float32Array(12);
  let sum = 0;
  for (const p of kept) {
    out[hzToPc(p.hz)] += p.amp;
    sum += p.amp;
  }
  if (sum === 0) return null;
  for (let i = 0; i < 12; i++) out[i] /= sum;
  return out;
}

/**
 * Is this chord (given as the pitch classes of its root, third and fifth) being played?
 * At least two of the three tones must be present, and little may be left over for notes outside the chord.
 * Two strings (a power chord) count; one string never does.
 */
export function matchChord(chroma: Chroma | null, tones: number[]): boolean {
  if (!chroma || tones.length === 0) return false;
  let inChord = 0;
  let present = 0;
  for (const pc of tones) {
    inChord += chroma[pc];
    if (chroma[pc] >= 0.12) present++;
  }
  return present >= Math.min(2, tones.length) && inChord >= 0.7;
}
