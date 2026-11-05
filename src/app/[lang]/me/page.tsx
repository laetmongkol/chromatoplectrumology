import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import TzSync from "@/components/TzSync";
import { getCatalog } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n";
import { listPublishedSongs } from "@/lib/songs";
import { getPoints, getPrefs, getRecentPlays, getStats } from "@/lib/plays";
import { viewer } from "@/lib/viewer";

export default function Me({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" />}>
      <MeContent params={params} />
    </Suspense>
  );
}

const fmtTime = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m` : `${Math.max(0, Math.round(s / 60))}m`);

async function MeContent({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [i18n, catalog, v, songList] = await Promise.all([getI18n(lang), getCatalog(), viewer(), listPublishedSongs()]);
  if (!i18n) notFound();
  const { t, slug, locale } = i18n;

  if (!v.session) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="m-0 mb-4 text-4xl font-normal">{t("me.title")}</h1>
        <p className="mb-8 text-[var(--muted)]">{t("me.loginNeeded")}</p>
        <Link className="pill" href={`/${slug}/login`}>
          {t("nav.login")}
        </Link>
      </main>
    );
  }

  const userId = v.session.user.id;
  const [stats, prefs, runs, points] = await Promise.all([getStats(userId, v.today), getPrefs(userId), getRecentPlays(userId, 30), getPoints(userId)]);
  const level = Math.floor(points / 500) + 1;
  const levelPct = Math.round(((points % 500) / 500) * 100);
  const goalSec = prefs.dailyGoalMin * 60;
  const goalPct = Math.min(100, Math.round((stats.todaySeconds / goalSec) * 100));
  const maxDay = Math.max(goalSec, ...stats.days.map((d) => d.seconds), 1);
  const scaleName = (id: string) => {
    // runs on a song are saved as song:<address>:<mode>
    if (id.startsWith("song:")) return songList.find((x) => x.slug === id.split(":")[1])?.title ?? id;
    const sc = catalog.scales.find((x) => x.id === id);
    return sc ? t(sc.labelKey) : id;
  };
  const when = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  const cards = [
    { label: t("me.runs"), value: String(stats.runs) },
    { label: t("me.time"), value: fmtTime(stats.totalSeconds) },
    { label: t("me.best"), value: stats.bestScore.toLocaleString(locale) },
    { label: t("me.streak"), value: t("me.days", { n: stats.streak }) },
    { label: t("me.points"), value: points.toLocaleString(locale), sub: `${t("me.level", { n: level })} · ${levelPct}%` },
  ];

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-10">
      <TzSync current={v.off} />
      <h1 className="m-0 text-5xl font-normal leading-none sm:text-6xl">{t("me.title")}</h1>
      <p className="mb-6 mt-4 max-w-[52ch] text-[var(--muted)]">{t("me.lead")}</p>
      <div className="mb-10 flex flex-wrap gap-2">
        <Link className="pill sm" href={`/${slug}/leaderboard`}>
          {t("nav.leaderboard")}
        </Link>
        <Link className="pill sm" href={`/${slug}/settings`}>
          {t("nav.settings")}
        </Link>
      </div>

      <ul className="m-0 mb-10 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-5">
        {cards.map((c) => (
          <li key={c.label} className="reveal rounded-2xl border border-[var(--line)] p-5">
            <p className="m-0 font-mono text-xs uppercase text-[var(--muted)]">{c.label}</p>
            <p className="m-0 mt-3 text-3xl font-light">{c.value}</p>
            {"sub" in c && <p className="m-0 mt-1 text-xs text-[var(--muted)]">{c.sub}</p>}
          </li>
        ))}
      </ul>

      <section className="mb-10 rounded-2xl border border-[var(--line)] p-6">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="m-0 font-mono text-xs font-normal uppercase">{t("me.goal")}</h2>
          <span className="text-sm text-[var(--muted)]">
            {t("me.minutes", { n: Math.floor(stats.todaySeconds / 60) })} / {t("me.minutes", { n: prefs.dailyGoalMin })}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--hover)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalPct}>
          <div className="h-full rounded-full bg-[var(--ink)] transition-[width] duration-1000" style={{ width: `${goalPct}%` }} />
        </div>
        {goalPct >= 100 && <p className="mb-0 mt-3 text-sm">{t("me.goalDone")}</p>}

        <h3 className="mb-3 mt-8 font-mono text-xs font-normal uppercase text-[var(--muted)]">{t("me.last14")}</h3>
        <div className="flex h-28 items-end gap-1.5" aria-hidden="true">
          {stats.days.map((d, i) => (
            <div key={i} className="flex h-full flex-1 items-end" title={`${d.day} · ${t("me.minutes", { n: Math.round(d.seconds / 60) })}`}>
              <div className={`w-full rounded-t ${d.seconds >= goalSec ? "bg-[var(--ink)]" : "bg-[var(--line)]"}`} style={{ height: `${Math.max(d.seconds ? 6 : 2, (d.seconds / maxDay) * 100)}%` }} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-mono text-xs font-normal uppercase">{t("me.history")}</h2>
        {runs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-[var(--muted)]">{t("me.empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] font-mono text-xs uppercase text-[var(--muted)]">
                  {["me.when", "me.scale", "me.score", "me.acc", "me.combo", "me.length"].map((k) => (
                    <th key={k} className="px-4 py-3 font-normal">
                      {t(k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-4 py-3 text-[var(--muted)]">{when.format(new Date(r.createdAt.getTime() - (v.off ?? 0) * 60000))}</td>
                    <td className="px-4 py-3">{scaleName(r.scaleId)}</td>
                    <td className="px-4 py-3 font-medium">{r.score.toLocaleString(locale)}</td>
                    <td className="px-4 py-3">{r.accuracy}%</td>
                    <td className="px-4 py-3">{r.bestCombo}</td>
                    <td className="px-4 py-3">{fmtTime(r.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
