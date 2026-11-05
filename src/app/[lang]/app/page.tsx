import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import RiseText from "@/components/RiseText";
import SiteNav from "@/components/SiteNav";
import { getCatalog } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n";

type Params = Promise<{ lang: string }>;

// Step before the practice room: choose what you are going to play.
// A full-screen gallery of photo panels (see .pick in globals.css). The list and photos come from the instrument catalog.
export default function InstrumentPicker({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="pick" />}>
      <PickerContent params={params} />
    </Suspense>
  );
}

async function PickerContent({ params }: { params: Params }) {
  const { lang } = await params;
  const [i18n, catalog] = await Promise.all([getI18n(lang), getCatalog()]);
  if (!i18n) notFound();
  const { t, slug } = i18n;
  // the panel that is open when nothing is hovered: the first instrument you can actually play
  const firstOpen = Math.max(0, catalog.instruments.findIndex((i) => i.available));
  // photographers of the photos that are shown, listed once each
  const credits = [...new Set(catalog.instruments.filter((i) => i.image && i.imageCredit).map((i) => i.imageCredit as string))];

  return (
    <main className="pick">
      <SiteNav i18n={i18n} />

      <div className="pick-head">
        <h1>
          <RiseText text={t("picker.title").replace(/\*/g, "")} />
        </h1>
        <p className="fade-up" style={{ animationDelay: "0.5s" }}>
          {t("picker.lead")}
        </p>
      </div>

      <ul className="pick-panels">
        {catalog.instruments.map((i, n) => {
          const label = t(i.labelKey);
          const meta = i.stringNames.length > 0 ? `${t("picker.strings", { n: i.stringNames.length })} · ${i.stringNames.join(" ")}` : "";
          return (
            <li key={i.id} className={`pick-panel${i.available ? "" : " off"}${n === firstOpen ? " is-default" : ""}`} style={{ "--n": n } as React.CSSProperties}>
              {i.image && <Image src={i.image} alt="" fill sizes="(max-width: 760px) 100vw, 60vw" className="pick-photo" priority={n === firstOpen} />}
              <div className="pick-scrim" />
              {i.available && <Link className="pick-link" href={`/${slug}/app/${i.id}`} aria-label={label} />}
              <span className="pick-vtitle" aria-hidden="true">
                {label}
              </span>
              <div className="pick-info">
                <span className="pick-index">{String(n + 1).padStart(2, "0")}</span>
                <h2>{label}</h2>
                {meta && <p className="pick-meta">{meta}</p>}
                {i.available ? (
                  <span className="pick-cta go">{t("picker.start")} →</span>
                ) : (
                  <span className="pick-cta soon" aria-disabled="true">
                    {t("app.soon")}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {credits.length > 0 && <p className="pick-credit">{t("picker.photos", { names: credits.join(", ") })}</p>}
    </main>
  );
}
