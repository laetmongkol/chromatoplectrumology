/** Six guitar strings that vibrate (loading), hum slowly (404) or have one snapped (error). Pure CSS, see .strings-art. */
export default function StringsArt({ mode = "play", className = "" }: { mode?: "play" | "calm" | "snap"; className?: string }) {
  const cls = mode === "calm" ? "calm" : mode === "snap" ? "snap calm" : "";
  return (
    <svg className={`strings-art ${cls} ${className}`} viewBox="0 0 240 120" fill="none" stroke="currentColor" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M8 ${14 + i * 18} L232 ${14 + i * 18}`} strokeWidth={1 + (5 - i) * 0.35} strokeLinecap="round" style={{ "--i": i } as React.CSSProperties} />
      ))}
    </svg>
  );
}
