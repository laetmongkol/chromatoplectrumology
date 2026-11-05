import { FRET_WINDOW, scalePositions, type Instrument, type ScalePreset } from "@/lib/music";

const COLS = 6;
const LEFT = 40;
const COL_W = 92;
const TOP = 34;
const GAP = 31;
const BOARD_PAD = 15;

// Fret numbers that carry an inlay dot on a real neck (12 gets two).
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];

/** Fretboard diagram of the chosen scale. Colours come from CSS classes so it reads in light and dark themes. `target` ("string:fret") is the next note to play. */
export default function Fretboard({ scale, instrument, target, label }: { scale: ScalePreset; instrument: Instrument; target: string; label: string }) {
  const positions = scalePositions(scale, instrument);
  const names = instrument.stringNames;
  const count = names.length;
  const rowY = (s: number) => TOP + (count - 1 - s) * GAP;
  const boardTop = TOP - BOARD_PAD;
  const boardBottom = TOP + (count - 1) * GAP + BOARD_PAD;
  const midY = (boardTop + boardBottom) / 2;

  return (
    <svg viewBox="0 0 600 236" role="img" aria-label={label}>
      <rect className="fb-board" x={LEFT} y={boardTop} width={COLS * COL_W} height={boardBottom - boardTop} />

      {/* inlay dots, one per fret column that has them */}
      {Array.from({ length: COLS }, (_, c) => {
        const fret = scale.startFret + c;
        const cx = LEFT + c * COL_W + COL_W / 2;
        if (fret === 12 || fret === 24) {
          return (
            <g key={`in${c}`}>
              <circle className="fb-inlay" cx={cx} cy={midY - GAP} r={6.5} />
              <circle className="fb-inlay" cx={cx} cy={midY + GAP} r={6.5} />
            </g>
          );
        }
        return SINGLE_INLAYS.includes(fret) ? <circle key={`in${c}`} className="fb-inlay" cx={cx} cy={midY} r={6.5} /> : null;
      })}

      {/* fret wires */}
      {Array.from({ length: COLS + 1 }, (_, f) => (
        <line key={`w${f}`} className="fb-wire" x1={LEFT + f * COL_W} x2={LEFT + f * COL_W} y1={boardTop} y2={boardBottom} strokeWidth={f === 0 ? 3 : 1.5} />
      ))}

      {/* strings: thick at the bass side, thin at the treble side */}
      {names.map((name, s) => (
        <g key={name + s}>
          <line className="fb-string" x1={LEFT} x2={LEFT + COLS * COL_W} y1={rowY(s)} y2={rowY(s)} strokeWidth={3.2 - (s * 2) / Math.max(1, count - 1)} />
          <text className="fb-label" x={LEFT - 12} y={rowY(s) + 5} fontSize={14} textAnchor="end">
            {name}
          </text>
        </g>
      ))}

      {/* fret numbers */}
      {Array.from({ length: COLS }, (_, c) => (
        <text key={`n${c}`} className="fb-label" x={LEFT + c * COL_W + COL_W / 2} y={boardBottom + 22} fontSize={14} textAnchor="middle">
          {scale.startFret + c}
        </text>
      ))}

      {/* scale notes */}
      {positions.map((p) => {
        const col = p.fret - scale.startFret;
        if (col < 0 || col >= Math.min(COLS, FRET_WINDOW + 2)) return null;
        const cx = LEFT + col * COL_W + COL_W / 2;
        const cy = rowY(p.string);
        const isTarget = target === `${p.string}:${p.fret}`;
        return (
          <g key={`${p.string}:${p.fret}`}>
            {isTarget && <circle className="fb-target" cx={cx} cy={cy} r={18} />}
            <circle className={`fb-note${p.root ? " root" : ""}`} cx={cx} cy={cy} r={11} />
          </g>
        );
      })}
    </svg>
  );
}
