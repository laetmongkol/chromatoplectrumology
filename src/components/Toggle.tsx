"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * On/off switch drawn as a pill button with an icon, not a tick box.
 * Turning it on floods the pill with colour from the icon outwards. Screen readers hear it as a switch.
 */
export default function Toggle({
  checked,
  onChange,
  label,
  stateText,
  icon,
  style,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  /** small "On"/"Off" text at the end of the pill */
  stateText?: string;
  icon: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="tgl" style={style} onClick={() => onChange(!checked)}>
      <span className="tgl-ico" aria-hidden="true">
        {icon}
      </span>
      <span className="tgl-label">{label}</span>
      {stateText && (
        <span className="tgl-state" aria-hidden="true">
          {stateText}
        </span>
      )}
    </button>
  );
}

/** Metronome icon: the arm swings once per beat while the switch is on (--beat is the length of one beat). */
export function MetronomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21 10.2 3.5h3.6L16 21z" />
      <g className="tgl-arm">
        <path d="M12 17.5V6.5" />
        <circle cx="12" cy="9.4" r="1.5" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function NoteNamesIcon() {
  return <span className="tgl-glyph">Aa</span>;
}

export function HeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4.5" height="6.5" rx="1.6" />
      <rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6" />
    </svg>
  );
}
