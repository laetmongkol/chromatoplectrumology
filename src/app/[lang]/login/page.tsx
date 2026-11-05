import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { getSession } from "@/lib/auth";
import { getI18n } from "@/lib/i18n";

export default function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
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
      <AuthForm mode="login" />
    </main>
  );
}
