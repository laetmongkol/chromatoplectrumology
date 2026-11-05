import { notFound } from "next/navigation";
import { Suspense } from "react";
import SongSheet from "@/components/SongSheet";
import { getI18n } from "@/lib/i18n";
import { getPublishedSong, getVariants } from "@/lib/songs";

type Params = Promise<{ lang: string; song: string }>;

export default function SongPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" />}>
      <SongContent params={params} />
    </Suspense>
  );
}

async function SongContent({ params }: { params: Params }) {
  const { lang, song } = await params;
  const [i18n, row] = await Promise.all([getI18n(lang), getPublishedSong(song)]);
  if (!i18n || !row) notFound();
  const variants = await getVariants(row);
  const { t, slug } = i18n;

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-10">
      <h1 className="m-0 text-4xl font-normal leading-tight sm:text-5xl">{row.title}</h1>
      <p className="mb-10 mt-3 text-[var(--muted)]">
        {[row.artist, row.songKey && `${t("songs.key")} ${row.songKey}`, row.bpm && `${row.bpm} BPM`].filter(Boolean).join(" · ")}
      </p>
      <SongSheet songId={row.id} variants={variants} songKey={row.songKey} playHref={`/${slug}/songs/${row.slug}/play`} />
    </main>
  );
}
