// Admin-only data access. No caching: admins always see the live rows.

import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db, appSettings, effects, instruments, languages, media, scales, translationKeys, translations } from "@/db";
import { getSession, isAdmin } from "./auth";

/** Server-side guard for every admin action and route. The layout check alone is not enough. */
export async function requireAdmin(): Promise<void> {
  if (!isAdmin(await getSession())) throw new Error("Forbidden");
}

export async function listLanguages() {
  return db.select().from(languages).orderBy(asc(languages.sort), asc(languages.code));
}

export async function coverage() {
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(translationKeys);
  const rows = await db
    .select({ lang: translations.lang, n: sql<number>`count(*)::int` })
    .from(translations)
    .groupBy(translations.lang);
  const byLang = new Map(rows.map((r) => [r.lang, r.n]));
  return { total, byLang };
}

export interface KeyFilter {
  lang: string;
  q: string;
  ns: string;
  missingOnly: boolean;
}

export async function listNamespaces(): Promise<string[]> {
  const rows = await db.selectDistinct({ ns: translationKeys.namespace }).from(translationKeys).orderBy(asc(translationKeys.namespace));
  return rows.map((r) => r.ns);
}

export async function listKeys(f: KeyFilter, limit = 400) {
  const conds = [];
  if (f.ns) conds.push(eq(translationKeys.namespace, f.ns));
  if (f.q) {
    const like = `%${f.q}%`;
    conds.push(or(ilike(translationKeys.key, like), ilike(translations.value, like)));
  }
  const rows = await db
    .select({
      key: translationKeys.key,
      description: translationKeys.description,
      current: sql<string | null>`max(case when ${translations.lang} = ${f.lang} then ${translations.value} end)`,
      english: sql<string | null>`max(case when ${translations.lang} = 'en' then ${translations.value} end)`,
    })
    .from(translationKeys)
    .leftJoin(translations, eq(translations.key, translationKeys.key))
    .where(conds.length ? and(...conds) : undefined)
    .groupBy(translationKeys.key, translationKeys.description)
    .orderBy(asc(translationKeys.key))
    .limit(limit * 2);
  const filtered = f.missingOnly ? rows.filter((r) => !r.current) : rows;
  return filtered.slice(0, limit);
}

export async function allTranslationsFor(lang: string): Promise<Record<string, string>> {
  const rows = await db.select({ key: translations.key, value: translations.value }).from(translations).where(eq(translations.lang, lang)).orderBy(asc(translations.key));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function catalogRows() {
  const [ins, sc, fx, st, md] = await Promise.all([
    db.select().from(instruments).orderBy(asc(instruments.sort)),
    db.select().from(scales).orderBy(asc(scales.sort)),
    db.select().from(effects).orderBy(asc(effects.sort)),
    db.select().from(appSettings).orderBy(asc(appSettings.key)),
    db.select().from(media).orderBy(asc(media.sort)),
  ]);
  return { instruments: ins, scales: sc, effects: fx, settings: st, media: md };
}
