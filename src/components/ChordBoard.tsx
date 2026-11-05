import { chordShape } from "@/lib/shapes";

const COLS = 6;
const LEFT = 40;
const COL_W = 92;
const TOP = 34;
const GAP = 31;
const PAD = 15;
const NAMES = ["E", "A", "D", "G", "B", "e"];
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];

/**
 * Fretboard diagram of a chord: a dot on each string where a finger goes, a ring for an open string, a cross for a string that is not played.
 * Drawn with the same classes as the scale fretboard so it looks the same in light and dark themes. Six-string guitar shapes only.
 */
export default function ChordBoard({ chord, next, label }: { chord: string; next?: string; label: string }) {
  const shape = chordShape(chord);
  const count = NAMES.length;
  const rowY = (s: number) => TOP + (count - 1 - s) * GAP;
  const boardTop = TOP - PAD;
  const boardBottom = TOP + (count - 1) * GAP + PAD;
  const midY = (boardTop + boardBottom) / 2;

  const fretted = (shape ?? []).filter((f): f is number => f !== null && f > 0);
  const top = fretted.length ? Math.max(...fretted) : 0;
  // show the open position unless the shape sits higher up the neck
  const start = top <= COLS - 1 ? 0 : Math.max(1, Math.min(...fretted));
  const lowestPlayed = shape ? shape.findIndex((f) => f !== null) : -1;

  return (
    <div>
      <svg viewBox={`0 0 600 ${boardBottom + 32}`} role="img" aria-label={label}>
        <rect className="fb-board" x={LEFT} y={boardTop} width={COLS * COL_W} height={boardBottom - boardTop} />
        {Array.from({ length: COLS }, (_, c) => {
          const fret = start + c;
          const cx = LEFT + c * COL_W + COL_W / 2;
          if (fret === 12) {
            return (
              <g key={`in${c}`}>
                <circle className="fb-inlay" cx={cx} cy={midY - GAP} r={6.5} />
                <circle className="fb-inlay" cx={cx} cy={midY + GAP} r={6.5} />
              </g>
            );
          }
          return SINGLE_INLAYS.includes(fret) ? <circle key={`in${c}`} className="fb-inlay" cx={cx} cy={midY} r={6.5} /> : null;
        })}
        {Array.from({ length: COLS + 1 }, (_, f) => (
          <line key={`w${f}`} className="fb-wire" x1={LEFT + f * COL_W} x2={LEFT + f * COL_W} y1={boardTop} y2={boardBottom} strokeWidth={f === 0 && start === 0 ? 3 : 1.5} />
        ))}
        {NAMES.map((name, s) => (
          <g key={name + s}>
            <line className="fb-string" x1={LEFT} x2={LEFT + COLS * COL_W} y1={rowY(s)} y2={rowY(s)} strokeWidth={3.2 - (s * 2) / (count - 1)} />
            <text className="fb-label" x={LEFT - 12} y={rowY(s) + 5} fontSize={14} textAnchor="end">
              {name}
            </text>
          </g>
        ))}
        {Array.from({ length: COLS }, (_, c) => (
          <text key={`n${c}`} className="fb-label" x={LEFT + c * COL_W + COL_W / 2} y={boardBottom + 22} fontSize={14} textAnchor="middle">
            {start + c}
          </text>
        ))}

        {shape?.map((f, s) => {
          const cy = rowY(s);
          if (f === null) {
            return (
              <text key={s} className="fb-label" x={LEFT - 28} y={cy + 5} fontSize={15} textAnchor="middle">
                ×
              </text>
            );
          }
          // an open string is a ring just left of the nut; a fretted one is a dot in its column
          const col = f - start;
          const cx = f === 0 ? LEFT - 28 : LEFT + col * COL_W + COL_W / 2;
          if (f !== 0 && (col < 0 || col >= COLS)) return null;
          return f === 0 ? (
            <circle key={s} cx={cx} cy={cy} r={6} style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 1.8 }} />
          ) : (
            <circle key={s} className={`fb-note${s === lowestPlayed ? " root" : ""}`} cx={cx} cy={cy} r={12} />
          );
        })}
      </svg>
      <p className="m-0 mt-1 flex items-baseline gap-3 font-mono text-sm text-[var(--muted)]">
        <b className="text-2xl font-light text-[var(--ink)]">{chord}</b>
        {next && <span>→ {next}</span>}
        {!shape && <span>–</span>}
      </p>
    </div>
  );
}
