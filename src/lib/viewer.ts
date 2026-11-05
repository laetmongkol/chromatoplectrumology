// Who is looking, and in which time zone. Both depend on the request, so call these inside <Suspense>.

import { cookies } from "next/headers";
import { getSession } from "./auth";

/** Minutes behind UTC as the browser reports it (getTimezoneOffset), or null before the browser has said. */
export async function tzOffset(): Promise<number | null> {
  const raw = (await cookies()).get("tzoff")?.value;
  const n = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : null;
}

/** The visitor's local date, YYYY-MM-DD. */
export function localToday(offsetMin: number | null): string {
  return new Date(Date.now() - (offsetMin ?? 0) * 60000).toISOString().slice(0, 10);
}

export async function viewer() {
  const [session, off] = await Promise.all([getSession(), tzOffset()]);
  return { session, off, today: localToday(off) };
}
