"use client";

import { useId, type ReactNode } from "react";

/** A page section whose heading is a button that folds the content away. Hidden content is inert, so it cannot be tabbed into. */
export default function Collapsible({
  id,
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const bodyId = useId();
  return (
    <section className="sec" id={id}>
      <h2>
        <button type="button" className="sec-toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
          <span className="sec-title">{title}</span>
          {hint && <span className="sec-hint">{hint}</span>}
          <svg className="sec-chev" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
            <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h2>
      <div id={bodyId} className="sec-body" data-open={open} inert={!open}>
        <div className="sec-inner">{children}</div>
      </div>
    </section>
  );
}
