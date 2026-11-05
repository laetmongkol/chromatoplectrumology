"use client";

import { useT } from "@/components/I18nProvider";
import { setTheme, useThemePref, type ThemePref } from "@/lib/theme";

const NEXT: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };

const icon = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/** Round icon button that cycles system -> light -> dark. The icon shows what is chosen: a screen (follow the device), sun, or moon. */
export default function ThemeToggle({ onHero = false }: { onHero?: boolean }) {
  const t = useT();
  const pref = useThemePref();
  return (
    <button
      type="button"
      className={`pill icon${onHero ? " light" : ""}`}
      aria-label={t("theme.toggle")}
      title={`${t("theme.toggle")}: ${pref}`}
      data-pref={pref}
      onClick={() => setTheme(NEXT[pref])}
    >
      {pref === "system" ? (
        <svg {...icon}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      ) : pref === "light" ? (
        <svg {...icon}>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9" />
        </svg>
      ) : (
        <svg {...icon}>
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
        </svg>
      )}
    </button>
  );
}
