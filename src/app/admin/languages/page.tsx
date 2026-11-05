import { addLanguage, saveLanguageMeta, setDefaultLanguage, setLanguageEnabled } from "@/app/admin/actions";
import { listLanguages } from "@/lib/admin";

export const instant = false;

export default async function LanguagesPage() {
  const langs = await listLanguages();
  return (
    <>
      <h1 className="app-h1">Languages</h1>
      <p className="lead">
        Visitors only see enabled languages. Fill in the translations first, then switch a language on. The URL prefix is the address people see (for example /jp/app), and the flag is a two-letter country code. Missing text falls back to the fallback language (Catalog → Settings).
      </p>
      <section className="sec">
        <div className="atable">
          {langs.map((l) => (
            <div className="lrow" key={l.code}>
              <div className="lname">
                {l.flag ? <span className={`fi fis fi-${l.flag} dd-flag`} aria-hidden="true" /> : <span className="dd-flag noflag" aria-hidden="true" />}
                <span>
                  {l.nativeName}
                  <small>
                    {" "}
                    {l.englishName} · {l.code}
                    {l.rtl ? " · right-to-left" : ""}
                    {l.isDefault ? " · default" : ""}
                  </small>
                </span>
              </div>
              <form action={saveLanguageMeta} className="row lmeta">
                <input type="hidden" name="code" value={l.code} />
                <label className="f" htmlFor={`slug-${l.code}`}>
                  URL prefix
                  <input id={`slug-${l.code}`} name="slug" type="text" defaultValue={l.slug ?? ""} placeholder={l.code.toLowerCase()} />
                </label>
                <label className="f" htmlFor={`flag-${l.code}`}>
                  Flag
                  <input id={`flag-${l.code}`} name="flag" type="text" defaultValue={l.flag ?? ""} placeholder="jp" maxLength={2} />
                </label>
                <button className="pill sm">Save</button>
              </form>
              <div className="row">
                <form action={setLanguageEnabled.bind(null, l.code, !l.enabled)}>
                  <button className={`pill sm${l.enabled ? " on" : ""}`} disabled={l.isDefault && l.enabled}>
                    {l.enabled ? "Enabled" : "Disabled"}
                  </button>
                </form>
                <form action={setDefaultLanguage.bind(null, l.code)}>
                  <button className="pill sm" disabled={l.isDefault}>
                    Make default
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="sec">
        <h2>Add a language</h2>
        <form action={addLanguage} className="row">
          <label className="f" htmlFor="code">
            Code (e.g. pt-BR)
            <input id="code" name="code" type="text" required />
          </label>
          <label className="f" htmlFor="nativeName">
            Name in that language
            <input id="nativeName" name="nativeName" type="text" required />
          </label>
          <label className="f" htmlFor="englishName">
            English name
            <input id="englishName" name="englishName" type="text" required />
          </label>
          <label className="f" htmlFor="slug">
            URL prefix
            <input id="slug" name="slug" type="text" placeholder="pt" />
          </label>
          <label className="f" htmlFor="flag">
            Flag (country code)
            <input id="flag" name="flag" type="text" placeholder="br" maxLength={2} />
          </label>
          <label className="chk" htmlFor="rtl">
            <input id="rtl" name="rtl" type="checkbox" /> Right-to-left
          </label>
          <button className="pill on">Add</button>
        </form>
      </section>
    </>
  );
}
