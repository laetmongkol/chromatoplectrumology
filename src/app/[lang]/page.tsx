import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import LiquidBackdrop from "@/components/LiquidBackdrop";
import RiseText from "@/components/RiseText";
import ScrollSteps from "@/components/ScrollSteps";
import SiteNav from "@/components/SiteNav";
import SmoothScroll from "@/components/SmoothScroll";
import { getCatalog } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n";
import { creditLine, getPhotos, photoByKey } from "@/lib/media";

export default function Landing({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="L-hero" style={{ minHeight: 560 }} />}>
      <LandingContent params={params} />
    </Suspense>
  );
}

async function LandingContent({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const [i18n, catalog, photos] = await Promise.all([getI18n(lang), getCatalog(), getPhotos()]);
  if (!i18n) notFound();
  const { t, slug } = i18n;
  const player = photoByKey(photos, "player");
  const pedals = photoByKey(photos, "pedals");
  const amp = photoByKey(photos, "amp");
  const guitar = photoByKey(photos, "teal-guitar");
  const steps = [
    { id: "s1", label: t("landing.s1.title") },
    { id: "s2", label: t("landing.s2.title") },
    { id: "s3", label: t("landing.f3.title") },
    { id: "s4", label: t("landing.s3.title") },
  ];
  const credits = creditLine(photos);

  return (
    <main className="landing">
      <SmoothScroll />
      <ScrollSteps steps={steps} scrollLabel={t("scroll.label")} />

      <header className="L-hero">
        <LiquidBackdrop />
        <SiteNav i18n={i18n} />
        <div className="L-title">
          <h1>
            <RiseText text={t("landing.hero.title")} />
          </h1>
          <p className="fade-up" style={{ animationDelay: "0.55s" }}>
            {t("landing.hero.sub")}
          </p>
          <div className="L-cta fade-up" style={{ animationDelay: "0.7s" }}>
            <Link className="pill light" href={`/${slug}/app`}>
              {t("landing.hero.cta")}
            </Link>
            <Link className="pill light ghost" href={`/${slug}/features`}>
              {t("landing.hero.cta2")}
            </Link>
          </div>
        </div>
      </header>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...photos, ...photos].map((p, i) => (
            <div className="marquee-tile" key={`${p.key}-${i}`}>
              <Image src={p.path} alt="" fill sizes="260px" />
            </div>
          ))}
        </div>
      </div>

      <div className="wrap">
        <section className="L-manifesto reveal">
          <h2>{t("landing.manifesto")}</h2>
        </section>

        <section id="s1" className="step reveal">
          <div className="step-copy">
            <p className="step-num">01 · {t("landing.s1.title")}</p>
            <h2>{t("landing.sig.title")}</h2>
            <p>{t("landing.sig.body")}</p>
            <ul className="ticks">
              <li>{t("landing.sig.b1")}</li>
              <li>{t("landing.sig.b2")}</li>
              <li>{t("landing.sig.b3")}</li>
            </ul>
          </div>
          <div className="step-media">{player && <Image src={player.path} alt="" fill sizes="(max-width: 800px) 100vw, 520px" />}</div>
        </section>

        <section id="s2" className="step flip reveal">
          <div className="step-copy">
            <p className="step-num">02 · {t("landing.s2.title")}</p>
            <h2>{t("landing.s2.title")}</h2>
            <p>{t("landing.s2.body")}</p>
            <Link className="pill sm" href={`/${slug}/app`}>
              {t("landing.more")}
            </Link>
          </div>
          <div className="step-media">
            {guitar && <Image src={guitar.path} alt="" fill sizes="(max-width: 800px) 100vw, 520px" />}
          </div>
        </section>

        <section id="s3" className="step reveal">
          <div className="step-copy">
            <p className="step-num">03 · {t("landing.f3.title")}</p>
            <h2>{t("landing.fx.title")}</h2>
            <p>{t("landing.fx.body")}</p>
            <ul className="chips">
              {catalog.effects.map((e) => (
                <li className="chip on" key={e.id}>
                  {t(e.labelKey)}
                </li>
              ))}
            </ul>
          </div>
          <div className="step-media">{pedals && <Image src={pedals.path} alt="" fill sizes="(max-width: 800px) 100vw, 520px" />}</div>
        </section>

        <section id="s4" className="step flip reveal">
          <div className="step-copy">
            <p className="step-num">04 · {t("landing.s3.title")}</p>
            <h2>{t("landing.fb.title")}</h2>
            <p>{t("landing.fb.body")}</p>
            <Link className="pill sm" href={`/${slug}/how`}>
              {t("landing.more")}
            </Link>
          </div>
          <div className="step-media">
            {amp && <Image src={amp.path} alt="" fill sizes="(max-width: 800px) 100vw, 520px" />}
            <span className="step-big">98%</span>
          </div>
        </section>
      </div>

      <section className="inst reveal">
        <div className="wrap inst-head">
          <h2>{t("landing.inst.title")}</h2>
          <p>{t("landing.inst.body")}</p>
        </div>
        <ul className="g-grid">
          {catalog.instruments.map((i) => (
            <li key={i.id} className={`g-tile${i.available ? "" : " off"}`}>
              {i.image && <Image src={i.image} alt="" fill sizes="(max-width: 560px) 100vw, 50vw" className="g-photo" />}
              <div className="g-scrim" />
              <div className="g-cap">
                <h3 className="g-title">{t(i.labelKey)}</h3>
                {i.available ? (
                  <Link className="g-link g-mono" href={`/${slug}/app/${i.id}`}>
                    {t("picker.start")} →
                  </Link>
                ) : (
                  <span className="g-link g-mono" aria-disabled="true">
                    {t("app.soon")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="L-band">
        <div className="wrap">
          <h2>{t("landing.band.title")}</h2>
          <Link className="pill light" href={`/${slug}/app`}>
            {t("landing.band.cta")}
          </Link>
        </div>
      </div>

      <div className="wrap">
        <div className="L-foot">
          <div>
            <b>{t("landing.foot.browser.title")}</b>
            {t("landing.foot.browser.body")}
          </div>
          <div>
            <b>{t("landing.foot.hw.title")}</b>
            {t("landing.foot.hw.body")}
          </div>
          <div>
            <b>{t("site.name")}</b>
            {t("landing.foot.brand")}
            {credits.length > 0 && (
              <>
                <br />
                {t("picker.photos", { names: credits.join(", ") })}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
