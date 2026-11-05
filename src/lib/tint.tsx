import type { ReactNode } from "react";

/**
 * Turns "What are you *playing*?" into text where the starred part is wrapped in <span class="tint">.
 * Translators move the asterisks to whichever word should carry the accent colour; no asterisks means no accent.
 */
export function renderTinted(text: string): ReactNode {
  return text.split(/\*(.+?)\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <span className="tint" key={i}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}
