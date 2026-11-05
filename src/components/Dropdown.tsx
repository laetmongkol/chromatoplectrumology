"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  /** ISO 3166 country code. When set, a round flag is shown in front of the label. */
  flag?: string | null;
  /** Small text under the label */
  hint?: string;
}

interface Props {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  /** id of the element that names this control (the text above it) */
  labelledBy?: string;
  /** used when there is no visible label */
  ariaLabel?: string;
  tone?: "light" | "dark";
  disabled?: boolean;
  /** open the list aligned to the right edge of the button */
  alignRight?: boolean;
  /** shrink to the width of the content instead of filling the row */
  compact?: boolean;
}

function Flag({ code }: { code: string }) {
  return <span className={`fi fis fi-${code} dd-flag`} aria-hidden="true" />;
}

/** Styled select: keyboard accessible (arrows, Home/End, Enter, Escape, type to jump), with optional flags. */
export default function Dropdown({ value, options, onChange, labelledBy, ariaLabel, tone = "light", disabled, alignRight, compact }: Props) {
  const uid = useId();
  const listId = `${uid}-list`;
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [active, setActive] = useState(selectedIndex);
  const typed = useRef({ text: "", at: 0 });
  const current = options[selectedIndex];

  // close when clicking elsewhere
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // keep the highlighted option in view
  useEffect(() => {
    if (!open) return;
    document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, uid]);

  const labels = useMemo(() => options.map((o) => o.label.toLowerCase()), [options]);

  function openList() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(i: number) {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        if (!open) return openList();
        setActive((a) => Math.max(0, Math.min(options.length - 1, a + (e.key === "ArrowDown" ? 1 : -1))));
        return;
      }
      case "Home":
      case "End":
        if (open) {
          e.preventDefault();
          setActive(e.key === "Home" ? 0 : options.length - 1);
        }
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(active);
        else openList();
        return;
      case "Escape":
      case "Tab":
        setOpen(false);
        return;
      default: {
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
        const now = Date.now();
        typed.current.text = (now - typed.current.at > 700 ? "" : typed.current.text) + e.key.toLowerCase();
        typed.current.at = now;
        const hit = labels.findIndex((l) => l.startsWith(typed.current.text));
        if (hit >= 0) {
          if (!open) setOpen(true);
          setActive(hit);
        }
      }
    }
  }

  return (
    <div ref={root} className={`dd ${tone}${compact ? " compact" : ""}`}>
      <button
        type="button"
        className="dd-btn"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : ariaLabel}
        aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        {current?.flag && <Flag code={current.flag} />}
        <span className="dd-text">{current?.label ?? ""}</span>
        <svg className="dd-chev" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true">
          <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul id={listId} role="listbox" className={`dd-list${alignRight ? " right" : ""}`} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : ariaLabel}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`dd-opt${i === active ? " active" : ""}`}
              onPointerEnter={() => setActive(i)}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
            >
              {o.flag && <Flag code={o.flag} />}
              <span className="dd-text">
                {o.label}
                {o.hint && <small>{o.hint}</small>}
              </span>
              {o.value === value && (
                <svg viewBox="0 0 12 10" width="12" height="10" aria-hidden="true" className="dd-tick">
                  <path d="M1 5.5 4.5 9 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
