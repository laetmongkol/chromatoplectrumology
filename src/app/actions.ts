"use server";

import { cookies } from "next/headers";
import { getEnabledLanguages, LOCALE_COOKIE } from "@/lib/i18n";

/** Remembers the visitor's language (by URL prefix) so the root address can send them back to it. */
export async function rememberLanguage(slug: string): Promise<void> {
  const langs = await getEnabledLanguages();
  if (!langs.some((l) => l.slug === slug)) return;
  (await cookies()).set(LOCALE_COOKIE, slug, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
