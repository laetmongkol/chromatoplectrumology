"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import type { LanguageInfo } from "@/lib/translate";

// Pages that start with a full-bleed hero: the nav floats over it in the theme's hero colours.
// The instrument picker is photos in both themes, so its nav is always white. Every other page gets a solid bar.
const HERO_PAGES = ["", "how", "features"];

/** One navigation for the whole site, mounted once in the language layout so it is not rebuilt on every page change. */
export default function NavShell({ children }: { children: ReactNode }) {
  const parts = (usePathname() ?? "").split("/").filter(Boolean);
  const page = parts.slice(1).join("/");
  const tone = page === "app" ? "photo" : HERO_PAGES.includes(page) ? "hero" : "solid";
  return (
    <nav className="L-nav" data-tone={tone}>
      {children}
    </nav>
  );
}

/** Language and theme controls. Their colours come from the nav's CSS variables, so they follow the bar's background. */
export function NavTools({ languages }: { languages: LanguageInfo[] }) {
  return (
    <>
      <LanguageSwitcher languages={languages} tone="dark" />
      <ThemeToggle onHero />
    </>
  );
}
