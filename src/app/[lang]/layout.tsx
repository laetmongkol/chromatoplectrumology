import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { I18nProvider } from "@/components/I18nProvider";
import { getEnabledLanguages, getI18n, LEGACY_PAGES, preferredSlug } from "@/lib/i18n";

type Params = Promise<{ lang: string }>;

// Every enabled language is prerendered. A language an admin enables later is built on its first visit.
export async function generateStaticParams() {
  const langs = await getEnabledLanguages();
  return langs.map((l) => ({ lang: l.slug }));
}

export default function LangLayout({ children, params }: { children: ReactNode; params: Params }) {
  return (
    <Suspense fallback={null}>
      <Gate params={params}>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ params, children }: { params: Params; children: ReactNode }) {
  const { lang } = await params;
  const i18n = await getI18n(lang);
  if (!i18n) {
    // Old links like /app or /login keep working: send them to the visitor's language.
    if (LEGACY_PAGES.includes(lang)) redirect(`/${await preferredSlug()}/${lang}`);
    notFound();
  }
  // Head tags are rendered here (React hoists them into <head>) so the language from the URL can set them
  // without making the whole route wait on generateMetadata().
  return (
    <>
      <title>{i18n.t("site.name")}</title>
      <meta name="description" content={i18n.t("landing.hero.sub")} />
      <link rel="canonical" href={`/${i18n.slug}`} />
      {i18n.languages.map((l) => (
        <link key={l.code} rel="alternate" hrefLang={l.code} href={`/${l.slug}`} />
      ))}
      <I18nProvider locale={i18n.locale} slug={i18n.slug} dir={i18n.dir} messages={i18n.messages}>
        {children}
      </I18nProvider>
    </>
  );
}
