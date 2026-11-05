import { addInstrument, addMedia, addScale, saveMedia, saveEffect, saveInstrument, saveScale, saveSetting } from "@/app/admin/actions";
import { catalogRows } from "@/lib/admin";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const instant = false;

export default async function CatalogPage() {
  const c = await catalogRows();
  return (
    <>
      <h1 className="app-h1">Catalog</h1>
      <p className="lead">What the practice app offers. Names are translation keys, so edit their text under Translations.</p>

      <section className="sec">
        <h2>
          Instruments <span>tuning = MIDI note of each open string, lowest first</span>
        </h2>
        {c.instruments.map((i) => (
          <form action={saveInstrument} className="row arow2" key={i.id}>
            <input type="hidden" name="id" value={i.id} />
            <b className="cell">{i.id}</b>
            <label className="chk">
              <input name="available" type="checkbox" defaultChecked={i.available} aria-label={`${i.id} available`} /> Available
            </label>
            <label className="f" htmlFor={`t-${i.id}`}>
              Tuning
              <input id={`t-${i.id}`} name="tuning" type="text" defaultValue={i.tuning.join(" ")} />
            </label>
            <label className="f" htmlFor={`s-${i.id}`}>
              String names
              <input id={`s-${i.id}`} name="stringNames" type="text" defaultValue={i.stringNames.join(" ")} />
            </label>
            <label className="f" htmlFor={`img-${i.id}`}>
              Photo (path in /public)
              <input id={`img-${i.id}`} name="image" type="text" defaultValue={i.image ?? ""} placeholder="/images/instruments/guitar.jpg" />
            </label>
            <label className="f" htmlFor={`cr-${i.id}`}>
              Photo credit
              <input id={`cr-${i.id}`} name="imageCredit" type="text" defaultValue={i.imageCredit ?? ""} />
            </label>
            <button className="pill sm">Save</button>
          </form>
        ))}
        <h2 style={{ marginTop: 24 }}>Add an instrument</h2>
        <form action={addInstrument} className="row">
          <label className="f" htmlFor="ai-id">
            Id (lowercase)
            <input id="ai-id" name="id" type="text" required />
          </label>
          <label className="f" htmlFor="ai-label">
            English name
            <input id="ai-label" name="label" type="text" required />
          </label>
          <label className="f" htmlFor="ai-tuning">
            Tuning
            <input id="ai-tuning" name="tuning" type="text" placeholder="40 45 50 55 59 64" />
          </label>
          <label className="f" htmlFor="ai-names">
            String names
            <input id="ai-names" name="stringNames" type="text" placeholder="E A D G B e" />
          </label>
          <label className="f" htmlFor="ai-img">
            Photo (path in /public)
            <input id="ai-img" name="image" type="text" placeholder="/images/instruments/drums.jpg" />
          </label>
          <label className="f" htmlFor="ai-credit">
            Photo credit
            <input id="ai-credit" name="imageCredit" type="text" />
          </label>
          <label className="chk">
            <input name="available" type="checkbox" /> Available
          </label>
          <button className="pill on">Add</button>
        </form>
      </section>

      <section className="sec">
        <h2>
          Scales <span>root 0 = C … 11 = B · intervals in semitones from the root</span>
        </h2>
        {c.scales.map((s) => (
          <form action={saveScale} className="row arow2" key={s.id}>
            <input type="hidden" name="id" value={s.id} />
            <b className="cell">{s.id}</b>
            <label className="chk">
              <input name="enabled" type="checkbox" defaultChecked={s.enabled} aria-label={`${s.id} enabled`} /> On
            </label>
            <label className="f" htmlFor={`r-${s.id}`}>
              Root ({NOTE_NAMES[s.rootPc]})
              <input id={`r-${s.id}`} name="rootPc" type="text" defaultValue={s.rootPc} />
            </label>
            <label className="f" htmlFor={`i-${s.id}`}>
              Intervals
              <input id={`i-${s.id}`} name="intervals" type="text" defaultValue={s.intervals.join(" ")} />
            </label>
            <label className="f" htmlFor={`f-${s.id}`}>
              Start fret
              <input id={`f-${s.id}`} name="startFret" type="text" defaultValue={s.startFret} />
            </label>
            <button className="pill sm">Save</button>
          </form>
        ))}
        <h2 style={{ marginTop: 24 }}>Add a scale</h2>
        <form action={addScale} className="row">
          <label className="f" htmlFor="as-id">
            Id (lowercase)
            <input id="as-id" name="id" type="text" required />
          </label>
          <label className="f" htmlFor="as-label">
            English name
            <input id="as-label" name="label" type="text" required />
          </label>
          <label className="f" htmlFor="as-inst">
            Instrument
            <select id="as-inst" name="instrumentId">
              {c.instruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.id}
                </option>
              ))}
            </select>
          </label>
          <label className="f" htmlFor="as-root">
            Root (0-11)
            <input id="as-root" name="rootPc" type="text" defaultValue="0" />
          </label>
          <label className="f" htmlFor="as-int">
            Intervals
            <input id="as-int" name="intervals" type="text" placeholder="0 2 4 5 7 9 11" required />
          </label>
          <label className="f" htmlFor="as-fret">
            Start fret
            <input id="as-fret" name="startFret" type="text" defaultValue="5" />
          </label>
          <button className="pill on">Add</button>
        </form>
      </section>

      <section className="sec">
        <h2>
          Effects <span>the sound engine builds these; here you choose which are offered and their starting amount</span>
        </h2>
        {c.effects.map((e) => (
          <form action={saveEffect} className="row arow2" key={e.id}>
            <input type="hidden" name="id" value={e.id} />
            <b className="cell">{e.id}</b>
            <label className="chk">
              <input name="enabled" type="checkbox" defaultChecked={e.enabled} aria-label={`${e.id} enabled`} /> On
            </label>
            <label className="f" htmlFor={`e-${e.id}`}>
              Default amount (0-100)
              <input id={`e-${e.id}`} name="defaultAmount" type="text" defaultValue={e.defaultAmount} />
            </label>
            <button className="pill sm">Save</button>
          </form>
        ))}
      </section>

      <section className="sec">
        <h2>
          Photos <span>extra pictures on the landing, features and how-it-works pages; the code asks for them by key</span>
        </h2>
        {c.media.map((m) => (
          <form action={saveMedia} className="row arow2" key={m.key}>
            <input type="hidden" name="key" value={m.key} />
            <b className="cell">{m.key}</b>
            <label className="f" htmlFor={`mp-${m.key}`}>
              Photo (path in /public)
              <input id={`mp-${m.key}`} name="path" type="text" defaultValue={m.path} required />
            </label>
            <label className="f" htmlFor={`mc-${m.key}`}>
              Photo credit
              <input id={`mc-${m.key}`} name="credit" type="text" defaultValue={m.credit ?? ""} />
            </label>
            <button className="pill sm">Save</button>
          </form>
        ))}
        <h2 style={{ marginTop: 24 }}>Add a photo</h2>
        <form action={addMedia} className="row">
          <label className="f" htmlFor="am-key">
            Key (lowercase)
            <input id="am-key" name="key" type="text" required />
          </label>
          <label className="f" htmlFor="am-path">
            Photo (path in /public)
            <input id="am-path" name="path" type="text" placeholder="/images/landing/studio.jpg" required />
          </label>
          <label className="f" htmlFor="am-credit">
            Photo credit
            <input id="am-credit" name="credit" type="text" />
          </label>
          <button className="pill on">Add</button>
        </form>
      </section>

      <section className="sec">
        <h2>Settings</h2>
        {c.settings.map((s) => (
          <form action={saveSetting} className="row arow2" key={s.key}>
            <input type="hidden" name="key" value={s.key} />
            <b className="cell">{s.key}</b>
            <label className="f" htmlFor={`st-${s.key}`}>
              {s.description ?? "Value"}
              <input id={`st-${s.key}`} name="value" type="text" defaultValue={String(s.value)} />
            </label>
            <button className="pill sm">Save</button>
          </form>
        ))}
      </section>
    </>
  );
}
