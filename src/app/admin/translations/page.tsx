import { addKey, deleteKey, importTranslations, saveTranslations } from "@/app/admin/actions";
import { listKeys, listLanguages, listNamespaces } from "@/lib/admin";

export const instant = false;

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function TranslationsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const langs = await listLanguages();
  const lang = langs.some((l) => l.code === one(sp.lang)) ? one(sp.lang) : (langs.find((l) => l.isDefault)?.code ?? "en");
  const q = one(sp.q);
  const ns = one(sp.ns);
  const missingOnly = one(sp.missing) === "1";
  const [rows, namespaces] = await Promise.all([listKeys({ lang, q, ns, missingOnly }), listNamespaces()]);
  const current = langs.find((l) => l.code === lang);

  return (
    <>
      <h1 className="app-h1">Translations</h1>
      <p className="lead">Edit the text for one language at a time. Leave a box empty to use the fallback language. Use {"{n}"}-style placeholders exactly as in the English text.</p>

      <section className="sec">
        <form method="get" className="row">
          <label className="f" htmlFor="lang">
            Language
            <select id="lang" name="lang" defaultValue={lang}>
              {langs.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.code})
                </option>
              ))}
            </select>
          </label>
          <label className="f" htmlFor="ns">
            Group
            <select id="ns" name="ns" defaultValue={ns}>
              <option value="">All</option>
              {namespaces.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="f" htmlFor="q">
            Search
            <input id="q" name="q" type="text" defaultValue={q} />
          </label>
          <label className="chk" htmlFor="missing">
            <input id="missing" name="missing" type="checkbox" value="1" defaultChecked={missingOnly} /> Missing only
          </label>
          <button className="pill sm on">Filter</button>
          <a className="pill sm" href={`/admin/translations/export?lang=${encodeURIComponent(lang)}`}>
            Export JSON
          </a>
        </form>
      </section>

      <section className="sec">
        <h2>
          {current?.nativeName} <span>{rows.length} keys shown</span>
        </h2>
        <form action={saveTranslations}>
          <input type="hidden" name="lang" value={lang} />
          <div className="atable">
            {rows.map((r) => (
              <div className="trow" key={r.key}>
                <div>
                  <code>{r.key}</code>
                  {r.description && <small> · {r.description}</small>}
                  {lang !== "en" && <p className="note">{r.english ?? "(no English text)"}</p>}
                </div>
                <textarea
                  name={`v:${r.key}`}
                  defaultValue={r.current ?? ""}
                  rows={Math.min(6, Math.max(1, Math.ceil(((r.current ?? r.english ?? "").length || 1) / 50)))}
                  dir={current?.rtl ? "rtl" : "ltr"}
                  aria-label={`${r.key} in ${lang}`}
                />
              </div>
            ))}
          </div>
          <div className="stickybar">
            <button className="pill on">Save changes</button>
          </div>
        </form>
      </section>

      <section className="sec">
        <h2>Import JSON</h2>
        <form action={importTranslations} className="row">
          <input type="hidden" name="lang" value={lang} />
          <label className="f" htmlFor="json" style={{ flexBasis: "100%" }}>
            {`{"key": "text"} for ${lang}. Unknown keys are ignored.`}
            <textarea id="json" name="json" rows={5} required />
          </label>
          <button className="pill on">Import into {lang}</button>
        </form>
      </section>

      <section className="sec">
        <h2>Add a key</h2>
        <form action={addKey} className="row">
          <label className="f" htmlFor="key">
            Key (group.name)
            <input id="key" name="key" type="text" placeholder="landing.newSection.title" required />
          </label>
          <label className="f" htmlFor="en">
            English text
            <input id="en" name="en" type="text" required />
          </label>
          <label className="f" htmlFor="description">
            Where it is used
            <input id="description" name="description" type="text" />
          </label>
          <button className="pill on">Add key</button>
        </form>
      </section>

      <section className="sec">
        <h2>Delete a key</h2>
        <form action={deleteKey} className="row">
          <label className="f" htmlFor="delkey">
            Exact key name. This removes its text in every language.
            <input id="delkey" name="key" type="text" required />
          </label>
          <button className="pill sm">Delete key</button>
        </form>
      </section>
    </>
  );
}
