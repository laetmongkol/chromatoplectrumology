"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
/** What the visitor picked: a fixed theme, or "system" to follow the device (the default). */
export type ThemePref = Theme | "system";

const STORAGE_KEY = "theme";
const QUERY = "(prefers-color-scheme: dark)";

/** The theme actually showing: the visitor's choice (html[data-theme]) or else the system setting. */
export function resolveTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "dark" || chosen === "light") return chosen;
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, resolveTheme, () => "light");
}

export function getThemePref(): ThemePref {
  const chosen = document.documentElement.dataset.theme;
  return chosen === "dark" || chosen === "light" ? chosen : "system";
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, getThemePref, () => "system");
}

/** "system" removes the fixed choice, so the page follows the device's light/dark setting again (and when it changes). */
export function setTheme(pref: ThemePref) {
  if (pref === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = pref;
  try {
    if (pref === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* storage blocked: the choice lasts for this visit only */
  }
}

/** Runs before first paint (inline in <head>) so a saved choice never flashes the other theme. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;
