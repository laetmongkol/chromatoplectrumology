import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { clearHistory, savePrefs } from "@/app/play-actions";
import { getI18n } from "@/lib/i18n";
import { getPrefs } from "@/lib/plays";
import { viewer } from "@/lib/viewer";

export default function Settings({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" />}>
      <SettingsContent params={params} />
    </Suspense>
  );
}

const input = "w-full rounded-xl border border-[var(--line)] bg-transparent px-4 py-3 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--ink)]";

async function SettingsContent({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [i18n, v] = await Promise.all([getI18n(lang), viewer()]);
  if (!i18n) notFound();
  const { t, slug } = i18n;

  if (!v.session) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="m-0 mb-4 text-4xl font-normal">{t("settings.title")}</h1>
        <p className="mb-8 text-[var(--muted)]">{t("me.loginNeeded")}</p>
        <Link className="pill" href={`/${slug}/login`}>
          {t("nav.login")}
        </Link>
      </main>
    );
  }
  const prefs = await getPrefs(v.session.user.id);

  return (
    <main className="mx-auto max-w-xl px-5 pb-24 pt-10">
      <h1 className="m-0 text-5xl font-normal leading-none sm:text-6xl">{t("settings.title")}</h1>
      <p className="mb-10 mt-4 text-[var(--muted)]">{t("settings.lead")}</p>

      <form action={savePrefs} className="grid gap-6">
        <label className="grid gap-2 text-sm" htmlFor="st-name">
          {t("settings.name")}
          <input id="st-name" name="name" type="text" maxLength={40} required defaultValue={v.session.user.name} className={input} />
        </label>
        <label className="grid gap-2 text-sm" htmlFor="st-goal">
          {t("settings.goal")}
          <input id="st-goal" name="dailyGoalMin" type="number" min={1} max={600} defaultValue={prefs.dailyGoalMin} className={input} />
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm" htmlFor="st-board">
          <input id="st-board" name="showOnBoard" type="checkbox" defaultChecked={prefs.showOnBoard} className="size-5 accent-[var(--ink)]" />
          {t("settings.board")}
        </label>
        <button className="pill on justify-self-start">{t("settings.save")}</button>
      </form>

      <details className="mt-16 rounded-2xl border border-[var(--line)] p-5">
        <summary className="cursor-pointer text-sm">{t("settings.clear")}</summary>
        <p className="mb-4 mt-3 text-sm text-[var(--muted)]">{t("settings.clearHint")}</p>
        <form action={clearHistory}>
          <button className="pill sm">{t("settings.clear")}</button>
        </form>
      </details>
    </main>
  );
}
