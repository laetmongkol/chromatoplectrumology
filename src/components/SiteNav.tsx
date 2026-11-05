import Link from "next/link";
import { Suspense } from "react";
import AuthNav, { authLabels } from "@/components/AuthNav";
import Brand from "@/components/Brand";
import NavPopover from "@/components/NavPopover";
import NavShell, { NavTools } from "@/components/NavShell";
import type { I18n } from "@/lib/i18n";

/**
 * The site-wide top navigation, rendered once by the language layout. Hides while scrolling down (ScrollNav).
 * Pages are grouped under "Explore"; the account items sit in one drop-down; Open app is its own button on the right.
 */
export default function SiteNav({ i18n }: { i18n: I18n }) {
  const { t, slug } = i18n;
  const explore = [
    { href: `/${slug}/songs`, label: t("nav.songs") },
    { href: `/${slug}/leaderboard`, label: t("nav.leaderboard") },
    { href: `/${slug}/how`, label: t("nav.how") },
    { href: `/${slug}/features`, label: t("nav.features") },
  ];
  return (
    <NavShell>
      <div className="wrap">
        <Link className="logo" href={`/${slug}`}>
          <Brand name={t("site.name")} />
        </Link>
        <NavPopover label={t("nav.explore")} className="nav-wide" align="left">
          {explore.map((i) => (
            <Link key={i.href} href={i.href} role="menuitem">
              {i.label}
            </Link>
          ))}
        </NavPopover>
        <Suspense fallback={null}>
          <AuthNav labels={authLabels(t)} slug={slug} explore={explore} />
        </Suspense>
        <NavTools languages={i18n.languages} />
        <Link className="nav-cta" href={`/${slug}/app`}>
          {t("nav.openApp")}
        </Link>
      </div>
    </NavShell>
  );
}
