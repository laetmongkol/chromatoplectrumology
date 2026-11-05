import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { getSession, isAdmin } from "@/lib/auth";

// Admin pages read live data on every request, so they opt out of instant-navigation prerendering.
export const instant = false;

// The admin console is English only: it is a working tool for the site owner, and everything visitors see is translated from here.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="note" style={{ padding: 16 }}>Loading…</p>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

async function Guard({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session)) {
    return (
      <main className="wrap">
        <h1 className="app-h1">No access</h1>
        <p className="lead">This account is not an admin. Run <code>npm run make-admin -- {session.user.email}</code> in the project folder to grant access.</p>
        <Link className="pill" href="/app">Back to the app</Link>
      </main>
    );
  }
  return (
    <main className="wrap">
      <header className="top">
        <span className="logo">Chromatoplectrumology Admin</span>
        <Link href="/admin">Overview</Link>
        <Link href="/admin/languages">Languages</Link>
        <Link href="/admin/translations">Translations</Link>
        <Link href="/admin/catalog">Catalog</Link>
        <Link href="/admin/songs">Songs</Link>
        <Link href="/app">App</Link>
      </header>
      {children}
    </main>
  );
}
