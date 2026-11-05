import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { connection } from "next/server";
import { db, account, session, user, verification } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      // Set only in the database (npm run make-admin); never accepted from a sign-up form.
      role: { type: "string", defaultValue: "user", input: false },
    },
  },
  plugins: [nextCookies()],
});

export type AppSession = typeof auth.$Infer.Session;

/**
 * Current session or null. Depends on the request (cookies) and on the current time, so it always runs at request time:
 * call it inside <Suspense> so the rest of the page can still be prerendered.
 */
export async function getSession(): Promise<AppSession | null> {
  await connection();
  return auth.api.getSession({ headers: await headers() });
}

export function isAdmin(s: AppSession | null): boolean {
  return (s?.user as { role?: string } | undefined)?.role === "admin";
}
