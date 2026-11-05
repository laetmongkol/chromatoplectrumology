import Link from "next/link";
import { coverage, listLanguages } from "@/lib/admin";

export const instant = false;

export default async function AdminHome() {
  const [langs, cov] = await Promise.all([listLanguages(), coverage()]);
  return (
    <>
      <h1 className="app-h1">Overview</h1>
      <p className="lead">Everything visitors read comes from the database. Change it here and the site updates right away.</p>
      <section className="sec">
        <h2>
          Translation coverage <span>{cov.total} keys</span>
        </h2>
        <div className="atable">
          {langs.map((l) => {
            const n = cov.byLang.get(l.code) ?? 0;
            const pct = cov.total ? Math.round((n / cov.total) * 100) : 0;
            return (
              <div className="arow" key={l.code}>
                <span>
                  {l.nativeName} <small>{l.code}</small>
                </span>
                <div className="bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <span>
                  {n}/{cov.total} · {l.enabled ? "enabled" : "disabled"}
                  {l.isDefault ? " · default" : ""}
                </span>
                <Link className="pill sm" href={`/admin/translations?lang=${encodeURIComponent(l.code)}&missing=1`}>
                  Fill gaps
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
