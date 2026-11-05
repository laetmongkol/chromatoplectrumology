import Link from "next/link";
import Brand from "@/components/Brand";
import { Suspense } from "react";
import AuthNav, { authLabels } from "@/components/AuthNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import type { I18n } from "@/lib/i18n";

/** Top navigation of the marketing pages. How it works and Features are pages of their own, not anchors. Hides while scrolling down (ScrollNav). */
export default function SiteNav({ i18n }: { i18n: I18n }) {
  const { t, slug } = i18n;
  return (
    <div className="L-nav">
      <div className="wrap">
        <Link className="logo" href={`/${slug}`}>
          <Brand name={t("site.name")} />
        </Link>
        <Link href={`/${slug}/how`}>{t("nav.how")}</Link>
        <Link href={`/${slug}/features`}>{t("nav.features")}</Link>
        <Link href={`/${slug}/app`}>{t("nav.openApp")}</Link>
        <Suspense fallback={null}>
          <AuthNav labels={authLabels(t)} slug={slug} />
        </Suspense>
        <LanguageSwitcher languages={i18n.languages} tone="dark" />
        <ThemeToggle onHero />
      </div>
    </div>
  );
}
