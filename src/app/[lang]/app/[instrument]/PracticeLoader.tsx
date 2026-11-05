"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { Catalog } from "@/lib/catalog";

// The practice page reads localStorage and audio devices, so it only renders in the browser.
const Practice = dynamic(() => import("@/components/Practice"), {
  ssr: false,
  loading: () => <p className="note" style={{ padding: 16 }}>…</p>,
});

export default function PracticeLoader({ catalog, instrumentId, authSlot, langSlot }: { catalog: Catalog; instrumentId: string; authSlot: ReactNode; langSlot: ReactNode }) {
  return <Practice catalog={catalog} instrumentId={instrumentId} authSlot={authSlot} langSlot={langSlot} />;
}
