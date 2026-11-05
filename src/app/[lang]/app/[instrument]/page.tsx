import { notFound } from "next/navigation";
import { Suspense } from "react";
import AuthNav, { authLabels } from "@/components/AuthNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getCatalog } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n";
import PracticeLoader from "./PracticeLoader";

type Params = Promise<{ lang: string; instrument: string }>;

// Only instruments marked available in the catalog get a practice room.
export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.instruments.filter((i) => i.available).map((i) => ({ instrument: i.id }));
}

export default function PracticePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <PracticeContent params={params} />
    </Suspense>
  );
}

async function PracticeContent({ params }: { params: Params }) {
  const { lang, instrument } = await params;
  const [i18n, catalog] = await Promise.all([getI18n(lang), getCatalog()]);
  if (!i18n) notFound();
  const chosen = catalog.instruments.find((i) => i.id === instrument);
  if (!chosen || !chosen.available) notFound();
  return (
    <main>
      <PracticeLoader
        catalog={catalog}
        instrumentId={chosen.id}
        authSlot={
          <Suspense fallback={null}>
            <AuthNav labels={authLabels(i18n.t)} slug={i18n.slug} />
          </Suspense>
        }
        langSlot={<LanguageSwitcher languages={i18n.languages} tone="light" />}
      />
    </main>
  );
}
