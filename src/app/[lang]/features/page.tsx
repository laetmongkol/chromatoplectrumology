import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PageHero from "@/components/PageHero";
import SmoothScroll from "@/components/SmoothScroll";
import { getI18n } from "@/lib/i18n";
import { getPhotos } from "@/lib/media";

export default function Features({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" />}>
      <FeaturesContent params={params} />
    </Suspense>
  );
}

async function FeaturesContent({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [i18n, photos] = await Promise.all([getI18n(lang), getPhotos()]);
  if (!i18n) notFound();
  const { t, slug } = i18n;
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({ n, title: t(`landing.f${n}.title`), desc: t(`landing.f${n}.desc`), photo: photos.length ? photos[(n - 1) % photos.length] : undefined }));

  return (
    <main>
      <SmoothScroll />
      <PageHero title={t("features.title")} lead={t("features.lead")} />

      <div className="mx-auto max-w-6xl px-5 py-16">
        <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <li key={f.n} className="reveal group overflow-hidden rounded-2xl border border-[var(--line)] transition-colors duration-500 hover:bg-[var(--hover)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--hover)]">
                {f.photo && <Image src={f.photo.path} alt="" fill sizes="(max-width: 640px) 100vw, 380px" className="object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105" />}
              </div>
              <div className="p-6">
                <p className="mb-3 font-mono text-xs uppercase">{String(f.n).padStart(2, "0")}</p>
                <h2 className="m-0 mb-2 text-2xl font-normal leading-tight">{f.title}</h2>
                <p className="m-0 leading-relaxed text-[var(--muted)]">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="pt-16 text-center">
          <Link className="pill" href={`/${slug}/app`}>
            {t("landing.band.cta")}
          </Link>
        </div>
      </div>
    </main>
  );
}
