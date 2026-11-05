import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCatalog } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n";
import { getLeaderboard } from "@/lib/plays";
import { viewer } from "@/lib/viewer";

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ instrument?: string; scale?: string; period?: string }> };

export default function Leaderboard(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" />}>
      <BoardContent {...props} />
    </Suspense>
  );
}

const PERIODS = [
  { id: "all", days: null, key: "board.period.all" },
  { id: "month", days: 30, key: "board.period.month" },
  { id: "week", days: 7, key: "board.period.week" },
] as const;

const chip = (on: boolean) => `rounded-full border px-4 py-1.5 text-sm no-underline transition-colors ${on ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--line)] text-[var(--ink)] hover:bg-[var(--hover)]"}`;

async function BoardContent({ params, searchParams }: Props) {
  const [{ lang }, q] = await Promise.all([params, searchParams]);
  const [i18n, catalog, v] = await Promise.all([getI18n(lang), getCatalog(), viewer()]);
  if (!i18n) notFound();
  const { t, slug, locale } = i18n;

  const playable = catalog.instruments.filter((i) => i.available);
  const instrument = playable.find((i) => i.id === q.instrument) ?? playable[0];
  const scales = catalog.scales.filter((s) => s.instrumentId === instrument?.id);
  const scale = scales.find((s) => s.id === q.scale) ?? scales.find((s) => s.id === catalog.settings.defaultScale) ?? scales[0];
  const period = PERIODS.find((p) => p.id === q.period) ?? PERIODS[0];
  const rows = instrument && scale ? await getLeaderboard(instrument.id, scale.id, period.days) : [];
  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams({ instrument: instrument?.id ?? "", scale: scale?.id ?? "", period: period.id, ...over });
    return `/${slug}/leaderboard?${p.toString()}`;
  };

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
      <h1 className="m-0 text-5xl font-normal leading-none sm:text-6xl">{t("board.title")}</h1>
      <p className="mb-8 mt-4 max-w-[52ch] text-[var(--muted)]">{t("board.lead")}</p>

      {playable.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {playable.map((i) => (
            <Link key={i.id} href={href({ instrument: i.id, scale: "" })} className={chip(i.id === instrument?.id)} scroll={false}>
              {t(i.labelKey)}
            </Link>
          ))}
        </div>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        {scales.map((s) => (
          <Link key={s.id} href={href({ scale: s.id })} className={chip(s.id === scale?.id)} scroll={false}>
            {t(s.labelKey)}
          </Link>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link key={p.id} href={href({ period: p.id })} className={chip(p.id === period.id)} scroll={false}>
            {t(p.key)}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">{t("board.empty")}</p>
      ) : (
        <ol className="m-0 list-none overflow-hidden rounded-2xl border border-[var(--line)] p-0">
          {rows.map((r, i) => {
            const me = v.session?.user.id === r.userId;
            return (
              <li key={r.userId} className={`flex items-center gap-4 border-b border-[var(--line)] px-5 py-4 last:border-0 ${me ? "bg-[var(--hover)]" : ""}`}>
                <span className={`w-8 shrink-0 font-mono text-lg ${i < 3 ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1 truncate">
                  {r.name}
                  {me && <span className="ml-2 rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]">{t("board.you")}</span>}
                </span>
                <span className="hidden text-sm text-[var(--muted)] sm:inline">
                  {r.accuracy}% · ×{r.bestCombo}
                </span>
                <span className="w-20 shrink-0 text-right text-xl font-light">{r.score.toLocaleString(locale)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
