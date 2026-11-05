"use client";

import dynamic from "next/dynamic";
import type { Catalog } from "@/lib/catalog";
import type { SongPlay } from "@/lib/songtime";

// The practice page reads localStorage and audio devices, so it only renders in the browser.
const Practice = dynamic(() => import("@/components/Practice"), {
  ssr: false,
  loading: () => <p className="note" style={{ padding: 16 }}>…</p>,
});

export default function PracticeLoader({ catalog, instrumentId, songs, initialSongSlug }: { catalog: Catalog; instrumentId: string; songs?: SongPlay[]; initialSongSlug?: string }) {
  return <Practice catalog={catalog} instrumentId={instrumentId} songs={songs} initialSongSlug={initialSongSlug} />;
}
