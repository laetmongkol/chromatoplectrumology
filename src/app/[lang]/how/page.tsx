import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PageHero from "@/components/PageHero";
import SmoothScroll from "@/components/SmoothScroll";
import { getI18n } from "@/lib/i18n";
import { getPhotos, photoByKey } from "@/lib/media";

export default function How({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[60svh]" />}>
      <HowContent params={params} />
    </Suspense>
  );
}

async function HowContent({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [i18n, photos] = await Promise.all([getI18n(lang), getPhotos()]);
  if (!i18n) notFound();
  const { t, slug } = i18n;
  const steps = [
    { title: t("landing.s1.title"), body: t("landing.sig.body"), photo: photoByKey(photos, "player") },
    { title: t("landing.s2.title"), body: t("landing.s2.body"), photo: photoByKey(photos, "pedals") },
    { title: t("landing.s3.title"), body: t("landing.fb.body"), photo: photoByKey(photos, "amp") },
  ];
  const faq = [1, 2, 3, 4].map((n) => ({ q: t(`faq.q${n}`), a: t(`faq.a${n}`) }));

  return (
    <main>
      <SmoothScroll />
      <PageHero title={t("nav.how")} lead={t("how.lead")} />

      <div className="mx-auto max-w-5xl px-5">
        {steps.map((s, i) => (
          <section key={i} className="reveal grid items-center gap-8 border-t border-[var(--ink)] py-16 md:grid-cols-2 md:gap-14">
            <div className={i % 2 ? "md:order-2" : ""}>
              <p className="mb-4 font-mono text-xs uppercase">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="m-0 mb-5 text-4xl font-normal leading-none sm:text-5xl">{s.title}</h2>
              <p className="max-w-[44ch] text-[17px] leading-relaxed text-[var(--muted)]">{s.body}</p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--hover)]">
              {s.photo && <Image src={s.photo.path} alt="" fill sizes="(max-width: 768px) 100vw, 520px" className="object-cover" />}
            </div>
          </section>
        ))}

        <section className="reveal border-t border-[var(--ink)] py-16">
          <h2 className="m-0 mb-8 text-4xl font-normal leading-none sm:text-5xl">{t("faq.title")}</h2>
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {faq.map((f, i) => (
              <details key={i} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--line)] transition-transform duration-500 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-[60ch] leading-relaxed text-[var(--muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="py-20 text-center">
          <Link className="pill" href={`/${slug}/app`}>
            {t("landing.band.cta")}
          </Link>
        </div>
      </div>
    </main>
  );
}
