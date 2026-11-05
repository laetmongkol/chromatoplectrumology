import Link from "next/link";
import { Suspense } from "react";
import StringsArt from "@/components/StringsArt";
import { getI18n, preferredSlug } from "@/lib/i18n";

export default function NotFound() {
  return (
    <Suspense fallback={<div className="min-h-svh" />}>
      <NotFoundContent />
    </Suspense>
  );
}

async function NotFoundContent() {
  const slug = await preferredSlug();
  const i18n = await getI18n(slug);
  const t = i18n?.t ?? ((k: string) => ({ "notfound.title": "Page not found", "notfound.body": "The link may be wrong, or the page may have moved.", "notfound.home": "Back to home" })[k] ?? k);
  return (
    <main className="grid min-h-svh place-items-center bg-[var(--paper)] px-6 text-center text-[var(--ink)]">
      <div className="state-pop flex max-w-md flex-col items-center gap-6">
        <StringsArt mode="calm" className="w-44" />
        <p className="m-0 font-mono text-7xl font-light tracking-tight sm:text-8xl">404</p>
        <h1 className="m-0 text-3xl font-normal leading-tight">{t("notfound.title")}</h1>
        <p className="m-0 leading-relaxed text-[var(--muted)]">{t("notfound.body")}</p>
        <Link className="pill" href={`/${i18n?.slug ?? slug}`}>
          {t("notfound.home")}
        </Link>
      </div>
    </main>
  );
}
