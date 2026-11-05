import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCatalog } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n";
import { listPlaySongs } from "@/lib/songs";
import PracticeLoader from "../../../app/[instrument]/PracticeLoader";

type Params = Promise<{ lang: string; song: string }>;

// The practice room with this song already chosen (the same room as /app/guitar, where any song can be picked).
export default function PlaySong({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <PlayContent params={params} />
    </Suspense>
  );
}

async function PlayContent({ params }: { params: Params }) {
  const { lang, song } = await params;
  const [i18n, catalog] = await Promise.all([getI18n(lang), getCatalog()]);
  if (!i18n) notFound();
  const instrument = catalog.instruments.find((i) => i.available && i.tuning.length > 0);
  if (!instrument) notFound();
  const songs = await listPlaySongs(instrument.id);
  if (!songs.some((x) => x.slug === song)) notFound();
  return (
    <main>
      <PracticeLoader catalog={catalog} instrumentId={instrument.id} songs={songs} initialSongSlug={song} />
    </main>
  );
}
