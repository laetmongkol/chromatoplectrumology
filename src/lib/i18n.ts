// Server side i18n. The language is part of the URL (/th, /en, /jp ...) and every text comes from the database.
// Reads are cached and cleared by tag when an admin saves.

import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { db, appSettings, languages, translations } from "@/db";
import { translate, type LanguageInfo, type Messages, type Vars } from "./translate";

export const LOCALE_COOKIE = "locale";
export const I18N_TAG = "i18n";

/** URL segments that belong to the site itself and can never be a language prefix. */
export const RESERVED_SLUGS = ["admin", "api", "app", "login", "signup", "_next"];
/** Pages that used to live at the root (/app) and are redirected to /{lang}/app. */
export const LEGACY_PAGES = ["app", "login", "signup"];

export async function getEnabledLanguages(): Promise<LanguageInfo[]> {
  "use cache";
  cacheTag(I18N_TAG);
  cacheLife("hours");
  const rows = await db.select().from(languages).where(eq(languages.enabled, true)).orderBy(asc(languages.sort));
  return rows.map((r) => ({
    code: r.code,
    slug: r.slug ?? r.code.toLowerCase(),
    flag: r.flag,
    nativeName: r.nativeName,
    rtl: r.rtl,
    isDefault: r.isDefault,
  }));
}

export async function getMessages(lang: string): Promise<Messages> {
  "use cache";
  cacheTag(I18N_TAG);
  cacheLife("hours");
  const rows = await db.select({ key: translations.key, value: translations.value }).from(translations).where(eq(translations.lang, lang));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getFallbackLang(): Promise<string> {
  "use cache";
  cacheTag(I18N_TAG);
  cacheLife("hours");
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "i18n.fallbackLang"));
  return typeof row?.value === "string" ? row.value : "en";
}

export interface I18n {
  /** Language code, e.g. "ja" */
  locale: string;
  /** URL prefix, e.g. "jp" */
  slug: string;
  dir: "ltr" | "rtl";
  languages: LanguageInfo[];
  /** Messages for this language with the fallback language filled in underneath. */
  messages: Messages;
  t: (key: string, vars?: Vars) => string;
}

/** Loads a language by its URL prefix. Returns null when the prefix is not an enabled language. Safe to prerender. */
export async function getI18n(slug: string): Promise<I18n | null> {
  const langs = await getEnabledLanguages();
  const info = langs.find((l) => l.slug === slug);
  if (!info) return null;
  const fallbackLang = await getFallbackLang();
  const [own, base] = await Promise.all([getMessages(info.code), info.code === fallbackLang ? Promise.resolve({}) : getMessages(fallbackLang)]);
  const messages: Messages = { ...base, ...own };
  return {
    locale: info.code,
    slug: info.slug,
    dir: info.rtl ? "rtl" : "ltr",
    languages: langs,
    messages,
    t: (key, vars) => translate(messages, key, vars),
  };
}

function matchAcceptLanguage(header: string | null, langs: LanguageInfo[]): LanguageInfo | null {
  if (!header) return null;
  const wanted = header
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .filter(Boolean);
  for (const w of wanted) {
    const lower = w.toLowerCase();
    const exact = langs.find((l) => l.code.toLowerCase() === lower || l.slug === lower);
    if (exact) return exact;
    const base = lower.split("-")[0];
    const loose = langs.find((l) => l.code.toLowerCase() === base || l.code.toLowerCase().startsWith(base + "-") || l.slug === base);
    if (loose) return loose;
  }
  return null;
}

/** Which language to send a visitor to when the URL has none: remembered choice, browser setting, site default. Reads the request, so call inside <Suspense>. */
export async function preferredSlug(): Promise<string> {
  const langs = await getEnabledLanguages();
  const remembered = (await cookies()).get(LOCALE_COOKIE)?.value;
  const fromCookie = langs.find((l) => l.slug === remembered);
  if (fromCookie) return fromCookie.slug;
  const fromBrowser = matchAcceptLanguage((await headers()).get("accept-language"), langs);
  if (fromBrowser) return fromBrowser.slug;
  const fallbackLang = await getFallbackLang();
  return (langs.find((l) => l.isDefault) ?? langs.find((l) => l.code === fallbackLang) ?? langs[0]).slug;
}
