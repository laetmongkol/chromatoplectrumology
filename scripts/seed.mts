// Seeds languages, translations, catalog and settings. Safe to re-run: existing admin edits are kept
// (translations use "do nothing on conflict"), so only missing rows are added.
// Run: npm run db:seed

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as s from "../src/db/schema.ts";
import { LANGUAGES } from "./seed-data/languages.mts";
import { COLS, SITE } from "./seed-data/site.mts";
import { LANDING } from "./seed-data/landing.mts";
import { ME } from "./seed-data/me.mts";
import { BASS_NAMES, BASS_SCALES } from "./seed-data/bass.mts";
import { SONGS_T } from "./seed-data/songs.mts";
import { APP, EFFECTS, INSTRUMENTS, SCALES, SETTINGS } from "./seed-data/app.mts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const db = drizzle(neon(url), { schema: s });

async function main() {
  await db
    .insert(s.languages)
    .values(LANGUAGES.map((l, i) => ({ rtl: false, isDefault: false, ...l, sort: i + 1 })))
    .onConflictDoNothing();

  // Older rows were created before slug/flag existed: fill only the empty ones, never overwrite admin edits.
  for (const l of LANGUAGES) {
    await db.execute(sql`update languages set slug = ${l.slug} where code = ${l.code} and slug is null`);
    await db.execute(sql`update languages set flag = ${l.flag} where code = ${l.code} and flag is null`);
  }
  await db.execute(
    sql`do $$ begin
      if not exists (select 1 from pg_constraint where conname = 'languages_slug_unique') then
        alter table languages add constraint languages_slug_unique unique (slug);
      end if;
    end $$`,
  );

  const rows = [...SITE, ...LANDING, ...ME, ...BASS_NAMES, ...SONGS_T, ...APP] as [string, string, string[]][];
  await db
    .insert(s.translationKeys)
    .values(rows.map(([key, description]) => ({ key, namespace: key.split(".")[0], description })))
    .onConflictDoNothing();

  const values: { key: string; lang: string; value: string }[] = [];
  for (const [key, , texts] of rows) {
    texts.forEach((value, i) => values.push({ key, lang: COLS[i], value }));
  }
  // chunk to keep each statement small
  for (let i = 0; i < values.length; i += 400) {
    await db.insert(s.translations).values(values.slice(i, i + 400)).onConflictDoNothing();
  }

  await db.insert(s.instruments).values(INSTRUMENTS).onConflictDoNothing();
  // photos were added after the first seed: fill only empty ones, never overwrite an admin's choice
  for (const i of INSTRUMENTS) {
    await db.execute(sql`update instruments set image = ${i.image}, image_credit = ${i.imageCredit} where id = ${i.id} and image is null`);
  }
  await db.insert(s.scales).values([...SCALES, ...BASS_SCALES]).onConflictDoNothing();
  await db.insert(s.effects).values(EFFECTS).onConflictDoNothing();
  await db.insert(s.appSettings).values(SETTINGS).onConflictDoNothing();

  const [{ n: keys }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.translationKeys);
  const [{ n: tr }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.translations);
  console.log(`seeded: ${LANGUAGES.length} languages, ${keys} keys, ${tr} translations`);
}

main().catch((e) => {
  console.error(String(e.message).replace(/npg_\w+/g, "***"));
  process.exit(1);
});
