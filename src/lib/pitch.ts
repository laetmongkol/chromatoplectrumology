// Monophonic pitch detection (normalised square difference, McLeod style).
// Good enough for single notes on a guitar string; chords are not supported.

export interface PitchResult {
  hz: number;
  clarity: number;
}

export function rmsOf(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

export function detectPitch(buf: Float32Array, sampleRate: number, minHz = 70, maxHz = 1100): PitchResult | null {
  const n = buf.length;
  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.min(Math.floor(sampleRate / minHz), n - 1);
  const half = n - maxLag;
  if (half < 256) return null;

  const nsdf = new Float32Array(maxLag + 1);
  for (let tau = minLag; tau <= maxLag; tau++) {
    let acf = 0;
    let m = 0;
    for (let i = 0; i < half; i++) {
      const a = buf[i];
      const b = buf[i + tau];
      acf += a * b;
      m += a * a + b * b;
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // Candidate peaks: local maxima after each positive-going zero crossing region.
  const peaks: number[] = [];
  let tau = minLag;
  while (tau < maxLag && nsdf[tau] > 0) tau++; // skip the initial positive lobe
  while (tau < maxLag) {
    while (tau < maxLag && nsdf[tau] <= 0) tau++;
    let best = -1;
    while (tau < maxLag && nsdf[tau] > 0) {
      if (best === -1 || nsdf[tau] > nsdf[best]) best = tau;
      tau++;
    }
    if (best > 0) peaks.push(best);
  }
  if (peaks.length === 0) return null;

  let maxVal = 0;
  for (const p of peaks) maxVal = Math.max(maxVal, nsdf[p]);
  const pick = peaks.find((p) => nsdf[p] >= 0.9 * maxVal);
  if (pick === undefined) return null;

  // Parabolic interpolation around the chosen lag.
  const y0 = nsdf[pick - 1];
  const y1 = nsdf[pick];
  const y2 = nsdf[pick + 1] ?? y1;
  const denom = y0 - 2 * y1 + y2;
  const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
  const lag = pick + shift;
  return { hz: sampleRate / lag, clarity: y1 };
}
