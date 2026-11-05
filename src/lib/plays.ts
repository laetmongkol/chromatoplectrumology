// Reads for the history, leaderboard and settings pages. Runs on the server, always live (no caching: it is per-user data).

import { and, desc, eq, sql } from "drizzle-orm";
import { db, plays, pointEvents, userPrefs } from "@/db";

export interface Prefs {
  dailyGoalMin: number;
  showOnBoard: boolean;
}

export async function getPrefs(userId: string): Promise<Prefs> {
  const [row] = await db.select().from(userPrefs).where(eq(userPrefs.userId, userId));
  return { dailyGoalMin: row?.dailyGoalMin ?? 15, showOnBoard: row?.showOnBoard ?? true };
}

/** Total points a player has earned (runs and songs). */
export async function getPoints(userId: string): Promise<number> {
  const [row] = await db.select({ n: sql<number>`coalesce(sum(${pointEvents.points}), 0)::int` }).from(pointEvents).where(eq(pointEvents.userId, userId));
  return row?.n ?? 0;
}

export async function getRecentPlays(userId: string, limit = 30) {
  return db.select().from(plays).where(eq(plays.userId, userId)).orderBy(desc(plays.createdAt)).limit(limit);
}

export interface Stats {
  runs: number;
  totalSeconds: number;
  bestScore: number;
  bestAccuracy: number;
  streak: number;
  /** Seconds practised on each of the last 14 days, oldest first, with the day label. */
  days: { day: string; seconds: number }[];
  todaySeconds: number;
}

const dayKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

/** `today` is the player's own local date (YYYY-MM-DD) as sent by the browser. */
export async function getStats(userId: string, today: string): Promise<Stats> {
  const [tot] = await db
    .select({
      runs: sql<number>`count(*)::int`,
      seconds: sql<number>`coalesce(sum(${plays.seconds}), 0)::int`,
      best: sql<number>`coalesce(max(${plays.score}), 0)::int`,
      acc: sql<number>`coalesce(max(${plays.accuracy}), 0)::int`,
    })
    .from(plays)
    .where(eq(plays.userId, userId));
  const perDay = await db
    .select({ day: plays.day, seconds: sql<number>`sum(${plays.seconds})::int` })
    .from(plays)
    .where(and(eq(plays.userId, userId), sql`${plays.day} <> ''`))
    .groupBy(plays.day);
  const map = new Map(perDay.map((r) => [r.day, r.seconds]));

  const base = new Date(`${today}T00:00:00Z`);
  const valid = !Number.isNaN(base.getTime());
  const days: Stats["days"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = valid ? dayKey(new Date(base.getTime() - i * 86400000)) : "";
    days.push({ day: d, seconds: map.get(d) ?? 0 });
  }
  // streak: consecutive days ending today (or yesterday, so the streak is not lost before you play today)
  let streak = 0;
  if (valid) {
    let cursor = map.has(today) ? base.getTime() : base.getTime() - 86400000;
    while (map.has(dayKey(new Date(cursor)))) {
      streak++;
      cursor -= 86400000;
    }
  }
  return { runs: tot.runs, totalSeconds: tot.seconds, bestScore: tot.best, bestAccuracy: tot.acc, streak, days, todaySeconds: map.get(today) ?? 0 };
}

export interface BoardRow {
  userId: string;
  name: string;
  score: number;
  accuracy: number;
  bestCombo: number;
}

/** Each player's single best run for an instrument and scale, best first. Players who opted out are left out. */
export async function getLeaderboard(instrumentId: string, scaleId: string, sinceDays: number | null): Promise<BoardRow[]> {
  const since = sinceDays ? new Date(Date.now() - sinceDays * 86400000) : new Date(0);
  const res = await db.execute(sql`
    select p.user_id as "userId", u.name as "name", p.score as "score", p.accuracy as "accuracy", p.best_combo as "bestCombo"
    from (
      select distinct on (user_id) user_id, score, accuracy, best_combo
      from plays
      where instrument_id = ${instrumentId} and scale_id = ${scaleId} and created_at >= ${since.toISOString()}
      order by user_id, score desc
    ) p
    join "user" u on u.id = p.user_id
    left join user_prefs up on up.user_id = p.user_id
    where coalesce(up.show_on_board, true)
    order by p.score desc
    limit 20
  `);
  return (res as unknown as { rows: BoardRow[] }).rows;
}
