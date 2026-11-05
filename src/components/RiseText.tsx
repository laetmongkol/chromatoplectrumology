import type { CSSProperties } from "react";

/**
 * Headline whose words rise into view one after another (pure CSS, see .rise in globals.css).
 * Text without spaces (Thai, Lao, Japanese) rises as one piece. Reduced motion shows it at rest.
 */
export default function RiseText({ text, step = 0.09, start = 0.1 }: { text: string; step?: number; start?: number }) {
  const words = text.split(/(\s+)/).filter((w) => w.length > 0);
  let n = 0;
  return (
    <span className="rise" aria-label={text}>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? (
          " "
        ) : (
          <span className="rise-word" aria-hidden="true" key={i}>
            <i style={{ "--d": `${start + step * n++}s` } as CSSProperties}>{w}</i>
          </span>
        ),
      )}
    </span>
  );
}
