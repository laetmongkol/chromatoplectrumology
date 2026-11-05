import { chordShape } from "@/lib/shapes";

const W = 96;
const LEFT = 18;
const GAP = 12; // between strings
const TOP = 26;
const FRET_H = 17;
const ROWS = 5;
const ORANGE = "#e8742c";

/**
 * A chord chart in the usual vertical form: strings run down, the nut is the thick top line (or a fret number is shown when the shape
 * sits higher up the neck), a dot is a finger, a ring is an open string, a cross is a string that is not played, and a bar is a barre.
 */
export default function ChordDiagram({ chord }: { chord: string }) {
  const shape = chordShape(chord);
  const fretted = (shape ?? []).filter((f): f is number => f !== null && f > 0);
  const lowest = fretted.length ? Math.min(...fretted) : 0;
  const highest = fretted.length ? Math.max(...fretted) : 0;
  const start = highest <= ROWS ? 1 : lowest; // first fret shown
  const nut = start === 1;
  const x = (s: number) => LEFT + s * GAP;
  const y = (fret: number) => TOP + (fret - start + 0.5) * FRET_H;
  const height = TOP + ROWS * FRET_H + 8;

  // a barre: the lowest fretted fret is pressed on several strings, with nothing lower in between
  let barre: { from: number; to: number } | null = null;
  if (shape && lowest > 0) {
    const on = shape.map((f, i) => (f === lowest ? i : -1)).filter((i) => i >= 0);
    if (on.length >= 3 || (on.length === 2 && on[1] - on[0] >= 3)) {
      const from = on[0];
      const to = on[on.length - 1];
      if (shape.slice(from, to + 1).every((f) => f === null || f >= lowest)) barre = { from, to };
    }
  }

  return (
    <figure className="m-0 grid justify-items-center gap-1.5">
      <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} role="img" aria-label={chord} className="text-[var(--muted)]">
        {/* frets and strings */}
        {Array.from({ length: ROWS + 1 }, (_, i) => (
          <line key={`f${i}`} x1={x(0)} x2={x(5)} y1={TOP + i * FRET_H} y2={TOP + i * FRET_H} stroke="currentColor" strokeWidth={i === 0 && nut ? 3 : 1} opacity={i === 0 && nut ? 1 : 0.6} />
        ))}
        {Array.from({ length: 6 }, (_, s) => (
          <line key={`s${s}`} x1={x(s)} x2={x(s)} y1={TOP} y2={TOP + ROWS * FRET_H} stroke="currentColor" strokeWidth={1} opacity={0.6} />
        ))}
        {!nut && (
          <text x={x(0) - 8} y={y(start) + 4} fontSize={10} textAnchor="end" fill="currentColor">
            {start}
          </text>
        )}
        {shape?.map((f, s) =>
          f === null ? (
            <text key={s} x={x(s)} y={TOP - 9} fontSize={11} textAnchor="middle" fill="var(--ink)">
              ×
            </text>
          ) : f === 0 ? (
            <circle key={s} cx={x(s)} cy={TOP - 12} r={3.4} style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 1.4 }} />
          ) : barre && f === lowest && s >= barre.from && s <= barre.to ? null : f - start >= 0 && f - start < ROWS ? (
            <circle key={s} cx={x(s)} cy={y(f)} r={4.6} fill={ORANGE} />
          ) : null,
        )}
        {barre && <rect x={x(barre.from) - 4.6} y={y(lowest) - 4.6} width={x(barre.to) - x(barre.from) + 9.2} height={9.2} rx={4.6} fill={ORANGE} />}
      </svg>
      <figcaption className="text-sm font-medium text-[var(--ink)]">{chord}</figcaption>
    </figure>
  );
}
