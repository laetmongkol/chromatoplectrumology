"use client";

import Link from "next/link";
import StringsArt from "@/components/StringsArt";
import { useLocalePath, useT } from "@/components/I18nProvider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  const path = useLocalePath();
  return (
    <main className="grid min-h-svh place-items-center bg-[var(--paper)] px-6 text-center text-[var(--ink)]">
      <div className="state-pop flex max-w-md flex-col items-center gap-6">
        <StringsArt mode="snap" className="w-44" />
        <h1 className="m-0 text-4xl font-normal leading-tight sm:text-5xl">{t("error.title")}</h1>
        <p className="m-0 leading-relaxed text-[var(--muted)]">{t("error.body")}</p>
        {error.digest && <p className="m-0 font-mono text-xs text-[var(--muted)]">{error.digest}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="pill" onClick={reset}>
            {t("error.retry")}
          </button>
          <Link className="pill ghost" href={path("/")}>
            {t("notfound.home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
