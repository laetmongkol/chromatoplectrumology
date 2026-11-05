"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, plays, pointEvents, songs, user, userPrefs } from "@/db";
import { getSession } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { runPoints, SONG_POINTS } from "@/lib/points";

const clamp = (n: unknown, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));

export interface PlayInput {
  instrumentId: string;
  scaleId: string;
  mode: string;
  bpm: number;
  score: number;
  bestCombo: number;
  hits: number;
  total: number;
  seconds: number;
  /** Player's local date, YYYY-MM-DD */
  day: string;
}

export type SaveResult = { ok: true; score: number; points: number } | { ok: false; reason: "login" | "short" | "invalid" };

/**
 * Saves a finished run for the signed-in player. The numbers come from the browser, so this only keeps what is plausible:
 * known instrument and scale, hits not above notes played, a sane duration, and accuracy worked out here, not trusted.
 * It cannot prove the player really played, so the leaderboard is "for fun", not a competition with prizes.
 */
export async function savePlay(input: PlayInput): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "login" };
  const catalog = await getCatalog();
  if (!catalog.instruments.some((i) => i.id === input.instrumentId && i.available)) return { ok: false, reason: "invalid" };
  // a run is either on a scale from the catalog or on a published song ("song:<address>")
  if (input.scaleId.startsWith("song:")) {
    const [song] = await db.select({ id: songs.id }).from(songs).where(and(eq(songs.slug, input.scaleId.slice(5).split(":")[0]), eq(songs.published, true)));
    if (!song) return { ok: false, reason: "invalid" };
  } else if (!catalog.scales.some((s) => s.id === input.scaleId)) {
    return { ok: false, reason: "invalid" };
  }
  const total = clamp(input.total, 0, 5000);
  const hits = clamp(input.hits, 0, total);
  const seconds = clamp(input.seconds, 0, 3 * 3600);
  if (total < 5 || seconds < 5) return { ok: false, reason: "short" };
  // each hit scores 100 + 5 x the combo so far, so a run of n hits cannot score more than this
  const score = clamp(input.score, 0, 100 * hits + (5 * hits * (hits + 1)) / 2);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(input.day) ? input.day : new Date().toISOString().slice(0, 10);
  const [saved] = await db.insert(plays).values({
    userId: session.user.id,
    instrumentId: input.instrumentId,
    scaleId: input.scaleId,
    mode: input.mode === "free" ? "free" : "beat",
    bpm: clamp(input.bpm, 20, 300),
    score,
    bestCombo: clamp(input.bestCombo, 0, hits),
    accuracy: Math.round((hits / total) * 100),
    hits,
    total,
    seconds,
    day,
  }).returning({ id: plays.id, accuracy: plays.accuracy });
  const points = runPoints(score, saved.accuracy);
  await db.insert(pointEvents).values({ userId: session.user.id, kind: "run", refId: saved.id, points, day });
  revalidatePath("/", "layout");
  return { ok: true, score, points };
}

export async function savePrefs(f: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const dailyGoalMin = clamp(f.get("dailyGoalMin"), 1, 600);
  const showOnBoard = f.get("showOnBoard") === "on";
  await db.insert(userPrefs).values({ userId: session.user.id, dailyGoalMin, showOnBoard }).onConflictDoUpdate({ target: userPrefs.userId, set: { dailyGoalMin, showOnBoard } });
  const name = String(f.get("name") ?? "").trim().slice(0, 40);
  if (name) await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, session.user.id));
  revalidatePath("/", "layout");
}

export async function clearHistory(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await db.delete(plays).where(eq(plays.userId, session.user.id));
  revalidatePath("/", "layout");
}

export type PracticeResult = { ok: true; points: number } | { ok: false; reason: "login" | "again" | "invalid" };

/** "I practiced this song": a few points, once per song per day (the player's own day). */
export async function practiceSong(songId: number, day?: string): Promise<PracticeResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "login" };
  const [song] = await db.select({ id: songs.id }).from(songs).where(and(eq(songs.id, Math.round(Number(songId) || 0)), eq(songs.published, true)));
  if (!song) return { ok: false, reason: "invalid" };
  const today = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : new Date().toISOString().slice(0, 10);
  const [again] = await db
    .select({ id: pointEvents.id })
    .from(pointEvents)
    .where(and(eq(pointEvents.userId, session.user.id), eq(pointEvents.kind, "song"), eq(pointEvents.refId, song.id), eq(pointEvents.day, today)));
  if (again) return { ok: false, reason: "again" };
  await db.insert(pointEvents).values({ userId: session.user.id, kind: "song", refId: song.id, points: SONG_POINTS, day: today });
  revalidatePath("/", "layout");
  return { ok: true, points: SONG_POINTS };
}
