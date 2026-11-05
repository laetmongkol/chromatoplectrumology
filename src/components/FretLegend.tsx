"use client";

import { useT } from "@/components/I18nProvider";

const SIZE = { width: 22, height: 22, minWidth: 22, maxWidth: 22, flex: "none" } as const;

const dot = (cls: string, r = 7) => (
  <svg style={SIZE} viewBox="0 0 22 22" aria-hidden="true">
    <circle className={cls} cx="11" cy="11" r={r} />
  </svg>
);

/** What the dots on the fretboard mean. `chord` is the chord diagram; otherwise the scale fretboard. */
export default function FretLegend({ chord }: { chord: boolean }) {
  const t = useT();
  const item = (icon: React.ReactNode, text: string) => (
    <li className="flex items-center gap-2">
      {icon}
      <span>{text}</span>
    </li>
  );
  return (
    <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-sm text-[var(--muted)]">
      {chord ? (
        <>
          {item(dot("fb-note root"), t("fret.legend.low"))}
          {item(dot("fb-note"), t("fret.legend.finger"))}
          {item(
            <svg style={SIZE} viewBox="0 0 22 22" aria-hidden="true">
              <circle cx="11" cy="11" r="5.5" style={{ fill: "none", stroke: "var(--ink)", strokeWidth: 1.8 }} />
            </svg>,
            t("fret.legend.open"),
          )}
          {item(<span className="grid size-[22px] place-items-center text-base text-[var(--ink)]">×</span>, t("fret.legend.mute"))}
        </>
      ) : (
        <>
          {item(dot("fb-note root"), t("fret.legend.root"))}
          {item(dot("fb-note"), t("fret.legend.note"))}
          {item(
            <svg style={SIZE} viewBox="0 0 22 22" aria-hidden="true">
              <circle className="fb-target" cx="11" cy="11" r="9" />
            </svg>,
            t("fret.legend.target"),
          )}
        </>
      )}
    </ul>
  );
}
