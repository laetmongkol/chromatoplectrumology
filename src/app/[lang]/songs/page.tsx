import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getI18n } from "@/lib/i18n";
import { listPublishedSongs } from "@/lib/songs";

export default function Songs({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" />}>
      <SongsContent params={params} />
    </Suspense>
  );
}

async function SongsContent({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [i18n, list] = await Promise.all([getI18n(lang), listPublishedSongs()]);
  if (!i18n) notFound();
  const { t, slug } = i18n;

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
      <h1 className="m-0 text-5xl font-normal leading-none sm:text-6xl">{t("songs.title")}</h1>
      <p className="mb-10 mt-4 max-w-[52ch] text-[var(--muted)]">{t("songs.lead")}</p>
      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">{t("songs.empty")}</p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {list.map((s) => (
            <li key={s.id}>
              <Link href={`/${slug}/songs/${s.slug}`} className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] p-5 no-underline transition-colors hover:bg-[var(--hover)]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xl text-[var(--ink)]">{s.title}</span>
                  {s.artist && <span className="block truncate text-sm text-[var(--muted)]">{s.artist}</span>}
                </span>
                {s.songKey && (
                  <span className="rounded-full border border-[var(--line)] px-3 py-1 font-mono text-xs text-[var(--muted)]">
                    {t("songs.key")} {s.songKey}
                  </span>
                )}
                <span className="text-[var(--muted)] transition-transform group-hover:translate-x-1" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
