"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A small drop-down for the top nav: a button that opens a list of links. Closes on outside click, Escape, or choosing an item.
 * `icon` swaps the text label for the three-line menu icon (the label stays as the accessible name).
 */
export default function NavPopover({ label, children, className = "", icon = false, align = "right" }: { label: string; children: ReactNode; className?: string; icon?: boolean; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={`nav-pop ${className}`}>
      <button type="button" className={`nav-pop-btn${icon ? " icon" : ""}`} aria-expanded={open} aria-haspopup="true" aria-label={icon ? label : undefined} onClick={() => setOpen((v) => !v)}>
        {icon ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        ) : (
          <>
            <span className="nav-pop-label">{label}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2 3.5 5 6.5 8 3.5" />
            </svg>
          </>
        )}
      </button>
      {open && (
        <div
          className={`nav-pop-list ${align === "left" ? "left" : "right"}`}
          role="menu"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a,button")) setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
