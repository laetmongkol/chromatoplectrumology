// Song reads for the public pages, the practice room and the admin master page.

import { and, asc, desc, eq } from "drizzle-orm";
import { db, songSheets, songs } from "@/db";
import { parseChart } from "./chords";
import { buildSongPlay, type SongPlay } from "./songtime";

export async function listPublishedSongs() {
  return db
    .select({ id: songs.id, slug: songs.slug, title: songs.title, artist: songs.artist, songKey: songs.songKey, bpm: songs.bpm })
    .from(songs)
    .where(eq(songs.published, true))
    .orderBy(asc(songs.title));
}

export async function getPublishedSong(slug: string) {
  const [row] = await db
    .select()
    .from(songs)
    .where(and(eq(songs.slug, slug), eq(songs.published, true)));
  return row ?? null;
}

export interface SheetVariant {
  /** "" for the song's own (default) sheet, otherwise an instrument id */
  instrumentId: string;
  body: string;
  bodyEasy: string;
}

/** The default sheet and every instrument-specific sheet of a song. */
export async function getVariants(song: { id: number; body: string; bodyEasy: string }): Promise<SheetVariant[]> {
  const rows = await db.select().from(songSheets).where(eq(songSheets.songId, song.id)).orderBy(asc(songSheets.instrumentId));
  return [{ instrumentId: "", body: song.body, bodyEasy: song.bodyEasy }, ...rows.filter((r) => r.body.trim() !== "").map((r) => ({ instrumentId: r.instrumentId, body: r.body, bodyEasy: r.bodyEasy }))];
}

/** Every published song ready for the practice room, using the sheet written for that instrument when there is one. */
export async function listPlaySongs(instrumentId: string): Promise<SongPlay[]> {
  // the room still works for scales if the song list cannot be read
  try {
    return await readPlaySongs(instrumentId);
  } catch (err) {
    console.error("songs unavailable", err);
    return [];
  }
}

async function readPlaySongs(instrumentId: string): Promise<SongPlay[]> {
  const rows = await db.select().from(songs).where(eq(songs.published, true)).orderBy(asc(songs.title));
  const sheets = await db.select().from(songSheets).where(eq(songSheets.instrumentId, instrumentId));
  const own = new Map(sheets.map((s) => [s.songId, s]));
  const out: SongPlay[] = [];
  for (const r of rows) {
    const mine = own.get(r.id);
    const hasOwn = !!mine?.body.trim();
    const body = hasOwn ? mine!.body : r.body;
    const easy = hasOwn ? mine!.bodyEasy : r.bodyEasy;
    const play = buildSongPlay(r, parseChart(body), easy.trim() ? parseChart(easy) : null);
    if (play.steps.length > 0) out.push(play);
  }
  return out;
}

/** Admin: every song, drafts included, newest first. */
export async function listAllSongs() {
  return db.select().from(songs).orderBy(desc(songs.updatedAt));
}

export async function getSongById(id: number) {
  const [row] = await db.select().from(songs).where(eq(songs.id, id));
  if (!row) return null;
  const sheets = await db.select().from(songSheets).where(eq(songSheets.songId, id));
  return { ...row, sheets };
}
