import Link from "next/link";
import Brand from "@/components/Brand";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";

export default function SignupPage({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const i18n = await getI18n(lang);
  if (!i18n) notFound();
  if (await getSession()) redirect(`/${i18n.slug}/app`);
  return (
    <main className="wrap">
      <header className="top">
        <Link className="logo" href={`/${i18n.slug}`}>
          <Brand name={i18n.t("site.name")} />
        </Link>
        <LanguageSwitcher languages={i18n.languages} tone="light" />
        <ThemeToggle />
      </header>
      <AuthForm mode="signup" />
    </main>
  );
}
