"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { db, appSettings, effects, instruments, languages, media, scales, translationKeys, translations } from "@/db";
import { requireAdmin } from "@/lib/admin";
import { CATALOG_TAG } from "@/lib/catalog";
import { I18N_TAG, RESERVED_SLUGS } from "@/lib/i18n";

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const int = (f: FormData, k: string, fallback = 0) => {
  const n = Number.parseInt(text(f, k), 10);
  return Number.isFinite(n) ? n : fallback;
};
const csvInts = (s: string) =>
  s
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((x) => Number.parseInt(x, 10))
    .filter((n) => Number.isFinite(n));
const csvText = (s: string) =>
  s
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);

function refreshI18n() {
  updateTag(I18N_TAG);
  revalidatePath("/admin", "layout");
}
function refreshCatalog() {
  updateTag(CATALOG_TAG);
  revalidatePath("/admin", "layout");
}

// ---------- languages ----------

export async function setLanguageEnabled(code: string, enabled: boolean) {
  await requireAdmin();
  await db.update(languages).set({ enabled }).where(eq(languages.code, code));
  refreshI18n();
}

export async function setDefaultLanguage(code: string) {
  await requireAdmin();
  await db.update(languages).set({ isDefault: false }).where(ne(languages.code, code));
  await db.update(languages).set({ isDefault: true, enabled: true }).where(eq(languages.code, code));
  refreshI18n();
}

/** URL prefix must be short, lowercase, and never collide with a site page like /admin or /app. */
function cleanSlug(raw: string, fallback: string): string | null {
  const slug = (raw || fallback).toLowerCase();
  if (!/^[a-z0-9-]{2,12}$/.test(slug) || RESERVED_SLUGS.includes(slug)) return null;
  return slug;
}
function cleanFlag(raw: string): string | null {
  const flag = raw.toLowerCase();
  return /^[a-z]{2}$/.test(flag) ? flag : null;
}

export async function addLanguage(f: FormData) {
  await requireAdmin();
  const code = text(f, "code");
  const nativeName = text(f, "nativeName");
  const englishName = text(f, "englishName");
  const slug = cleanSlug(text(f, "slug"), code);
  if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,4})?$/.test(code) || !nativeName || !englishName || !slug) return;
  await db
    .insert(languages)
    .values({ code, slug, flag: cleanFlag(text(f, "flag")), nativeName, englishName, rtl: f.get("rtl") === "on", enabled: false, sort: 100 })
    .onConflictDoNothing();
  refreshI18n();
}

export async function saveLanguageMeta(f: FormData) {
  await requireAdmin();
  const code = text(f, "code");
  const slug = cleanSlug(text(f, "slug"), code);
  if (!code || !slug) return;
  // Another language already uses this prefix: leave things as they are.
  const [taken] = await db.select({ code: languages.code }).from(languages).where(and(eq(languages.slug, slug), ne(languages.code, code)));
  if (taken) return;
  await db.update(languages).set({ slug, flag: cleanFlag(text(f, "flag")) }).where(eq(languages.code, code));
  refreshI18n();
}

// ---------- translations ----------

export async function saveTranslations(f: FormData) {
  await requireAdmin();
  const lang = text(f, "lang");
  if (!lang) return;
  const current = new Map(
    (await db.select({ key: translations.key, value: translations.value }).from(translations).where(eq(translations.lang, lang))).map((r) => [r.key, r.value]),
  );
  for (const [name, raw] of f.entries()) {
    if (!name.startsWith("v:")) continue;
    const key = name.slice(2);
    const value = String(raw).replace(/\r\n/g, "\n").trim();
    const old = current.get(key);
    if (value === (old ?? "")) continue;
    if (!value) {
      await db.delete(translations).where(and(eq(translations.key, key), eq(translations.lang, lang)));
    } else {
      await db
        .insert(translations)
        .values({ key, lang, value })
        .onConflictDoUpdate({ target: [translations.key, translations.lang], set: { value, updatedAt: new Date() } });
    }
  }
  refreshI18n();
}

export async function addKey(f: FormData) {
  await requireAdmin();
  const key = text(f, "key");
  const en = text(f, "en");
  if (!/^[a-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$/.test(key) || !en) return;
  await db
    .insert(translationKeys)
    .values({ key, namespace: key.split(".")[0], description: text(f, "description") || null })
    .onConflictDoNothing();
  await db.insert(translations).values({ key, lang: "en", value: en }).onConflictDoNothing();
  refreshI18n();
}

export async function deleteKey(f: FormData) {
  await requireAdmin();
  const key = text(f, "key");
  if (!key) return;
  await db.delete(translationKeys).where(eq(translationKeys.key, key));
  refreshI18n();
}

/** Accepts {"key": "text", ...} for one language. Unknown keys are created in the "imported" namespace use. */
export async function importTranslations(f: FormData) {
  await requireAdmin();
  const lang = text(f, "lang");
  let data: unknown;
  try {
    data = JSON.parse(String(f.get("json") ?? ""));
  } catch {
    return;
  }
  if (!lang || typeof data !== "object" || data === null || Array.isArray(data)) return;
  const known = new Set((await db.select({ key: translationKeys.key }).from(translationKeys)).map((r) => r.key));
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (typeof value !== "string" || !value.trim() || !known.has(key)) continue;
    await db
      .insert(translations)
      .values({ key, lang, value: value.trim() })
      .onConflictDoUpdate({ target: [translations.key, translations.lang], set: { value: value.trim(), updatedAt: new Date() } });
  }
  refreshI18n();
}

// ---------- catalog ----------

/** Photos live in /public, so only a plain site path is accepted (no URLs, no "..", no spaces). */
function cleanImage(raw: string): string | null {
  return /^\/[A-Za-z0-9/_.-]+$/.test(raw) && !raw.includes("..") ? raw : null;
}

export async function saveInstrument(f: FormData) {
  await requireAdmin();
  await db
    .update(instruments)
    .set({
      available: f.get("available") === "on",
      tuning: csvInts(text(f, "tuning")),
      stringNames: csvText(text(f, "stringNames")),
      image: cleanImage(text(f, "image")),
      imageCredit: text(f, "imageCredit") || null,
    })
    .where(eq(instruments.id, text(f, "id")));
  refreshCatalog();
}

export async function addInstrument(f: FormData) {
  await requireAdmin();
  const id = text(f, "id");
  const label = text(f, "label");
  if (!/^[a-z][a-z0-9-]*$/.test(id) || !label) return;
  const labelKey = `instrument.${id}`;
  await db.insert(translationKeys).values({ key: labelKey, namespace: "instrument", description: "Instrument name" }).onConflictDoNothing();
  await db.insert(translations).values({ key: labelKey, lang: "en", value: label }).onConflictDoNothing();
  await db
    .insert(instruments)
    .values({
      id,
      labelKey,
      available: f.get("available") === "on",
      tuning: csvInts(text(f, "tuning")),
      stringNames: csvText(text(f, "stringNames")),
      image: cleanImage(text(f, "image")),
      imageCredit: text(f, "imageCredit") || null,
      sort: 100,
    })
    .onConflictDoNothing();
  refreshI18n();
  refreshCatalog();
}

export async function saveScale(f: FormData) {
  await requireAdmin();
  await db
    .update(scales)
    .set({
      enabled: f.get("enabled") === "on",
      rootPc: Math.max(0, Math.min(11, int(f, "rootPc"))),
      startFret: Math.max(0, Math.min(20, int(f, "startFret"))),
      intervals: csvInts(text(f, "intervals")).filter((n) => n >= 0 && n < 12),
    })
    .where(eq(scales.id, text(f, "id")));
  refreshCatalog();
}

export async function addScale(f: FormData) {
  await requireAdmin();
  const id = text(f, "id");
  const label = text(f, "label");
  const instrumentId = text(f, "instrumentId");
  const intervals = csvInts(text(f, "intervals")).filter((n) => n >= 0 && n < 12);
  if (!/^[a-z][a-z0-9-]*$/.test(id) || !label || !instrumentId || intervals.length < 2) return;
  const labelKey = `scale.${id}`;
  await db.insert(translationKeys).values({ key: labelKey, namespace: "scale", description: "Scale name" }).onConflictDoNothing();
  await db.insert(translations).values({ key: labelKey, lang: "en", value: label }).onConflictDoNothing();
  await db
    .insert(scales)
    .values({ id, instrumentId, labelKey, rootPc: Math.max(0, Math.min(11, int(f, "rootPc"))), intervals, startFret: Math.max(0, Math.min(20, int(f, "startFret"))), sort: 100 })
    .onConflictDoNothing();
  refreshI18n();
  refreshCatalog();
}

export async function saveEffect(f: FormData) {
  await requireAdmin();
  await db
    .update(effects)
    .set({ enabled: f.get("enabled") === "on", defaultAmount: Math.max(0, Math.min(100, int(f, "defaultAmount", 50))) })
    .where(eq(effects.id, text(f, "id")));
  refreshCatalog();
}

/** Extra photos for the marketing pages, looked up by key (player, pedals, amp ...). */
export async function saveMedia(f: FormData) {
  await requireAdmin();
  const path = cleanImage(text(f, "path"));
  if (!path) return;
  await db.update(media).set({ path, credit: text(f, "credit") || null }).where(eq(media.key, text(f, "key")));
  refreshCatalog();
}

export async function addMedia(f: FormData) {
  await requireAdmin();
  const key = text(f, "key");
  const path = cleanImage(text(f, "path"));
  if (!/^[a-z][a-z0-9-]*$/.test(key) || !path) return;
  await db.insert(media).values({ key, path, credit: text(f, "credit") || null, sort: 100 }).onConflictDoNothing();
  refreshCatalog();
}

export async function saveSetting(f: FormData) {
  await requireAdmin();
  const key = text(f, "key");
  const raw = text(f, "value");
  let value: unknown = raw;
  if (raw !== "" && !Number.isNaN(Number(raw))) value = Number(raw);
  await db.update(appSettings).set({ value }).where(eq(appSettings.key, key));
  refreshCatalog();
  refreshI18n();
}
