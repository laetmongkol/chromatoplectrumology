import StringsArt from "@/components/StringsArt";

export default function Loading() {
  return (
    <div className="grid min-h-svh place-items-center bg-[var(--paper)] text-[var(--ink)]" role="status" aria-live="polite">
      <StringsArt className="w-48" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
