"use client";

import StringsArt from "@/components/StringsArt";
import "./globals.css";

// Last resort when the root layout itself fails. No database here, so the text is plain English.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-svh place-items-center bg-[var(--paper)] px-6 text-center text-[var(--ink)]">
          <div className="state-pop flex max-w-md flex-col items-center gap-6">
            <StringsArt mode="snap" className="w-44" />
            <h1 className="m-0 text-4xl font-normal">Something went wrong</h1>
            <button type="button" className="pill" onClick={reset}>
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
