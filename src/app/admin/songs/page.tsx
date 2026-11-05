import Link from "next/link";
import { deleteSong, saveSong } from "@/app/admin/actions";
import { getCatalog } from "@/lib/catalog";
import { getSongById, listAllSongs } from "@/lib/songs";
import SongEditor from "./SongEditor";

export const instant = false;

export default async function SongsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const q = await searchParams;
  const [all, catalog] = await Promise.all([listAllSongs(), getCatalog()]);
  const editId = Number(q.edit);
  const editing = Number.isFinite(editId) && editId > 0 ? await getSongById(editId) : null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="app-h1" style={{ marginBottom: 8 }}>
            Songs
          </h1>
          <p className="lead" style={{ marginBottom: 24 }}>
            The master list of chord sheets. Each song has a True sheet and an optional hand-written Easy sheet.
          </p>
        </div>
        <Link className="pill on mb-6" href="/admin/songs">
          + New song
        </Link>
      </div>

      <div className="grid items-start gap-6 pb-16 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="grid gap-2 lg:sticky lg:top-4">
          {all.length === 0 && <p className="rounded-2xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--muted)]">No songs yet.</p>}
          {all.map((s) => {
            const on = editing?.id === s.id;
            return (
              <Link
                key={s.id}
                href={`/admin/songs?edit=${s.id}`}
                className={`grid gap-1 rounded-2xl border p-4 no-underline transition-colors ${on ? "border-[var(--ink)] bg-[var(--hover)]" : "border-[var(--line)] hover:bg-[var(--hover)]"}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-[15px] text-[var(--ink)]">{s.title}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${s.published ? "bg-[var(--ink)] text-[var(--paper)]" : "border border-[var(--line)] text-[var(--muted)]"}`}>
                    {s.published ? "Live" : "Draft"}
                  </span>
                </span>
                <span className="flex gap-2 text-xs text-[var(--muted)]">
                  <span className="truncate">{s.artist || "-"}</span>
                  {s.songKey && <span>· {s.songKey}</span>}
                  {s.bodyEasy.trim() && <span>· Easy sheet</span>}
                </span>
              </Link>
            );
          })}
        </aside>

        <SongEditor key={editing?.id ?? "new"} song={editing} instruments={catalog.instruments.filter((i) => i.available).map((i) => i.id)} save={saveSong} remove={deleteSong} />
      </div>
    </>
  );
}
