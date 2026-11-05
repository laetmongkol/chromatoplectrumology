"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocalePath, useT } from "@/components/I18nProvider";
import { authClient } from "@/lib/auth-client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const t = useT();
  const path = useLocalePath();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "");
    const password = String(f.get("password") ?? "");
    const res = signup
      ? await authClient.signUp.email({ name: String(f.get("name") ?? ""), email, password })
      : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      const code = res.error.code ?? "";
      setError(code.includes("EXISTS") ? t("auth.err.exists") : signup ? t("auth.err.generic") : t("auth.err.invalid"));
      return;
    }
    router.push(path("/app"));
    router.refresh();
  }

  return (
    <form className="authform" onSubmit={onSubmit}>
      <h1 className="app-h1">{t(signup ? "auth.signup.title" : "auth.login.title")}</h1>
      {signup && (
        <label className="f" htmlFor="name">
          {t("auth.name")}
          <input id="name" name="name" type="text" autoComplete="name" required />
        </label>
      )}
      <label className="f" htmlFor="email">
        {t("auth.email")}
        <input id="email" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="f" htmlFor="password">
        {t("auth.password")}
        <input id="password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={8} required />
        {signup && <span className="note">{t("auth.passwordHint")}</span>}
      </label>
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      <button className="pill on" type="submit" disabled={busy}>
        {busy ? t("auth.loading") : t(signup ? "auth.signup.submit" : "auth.login.submit")}
      </button>
      <Link className="note" href={path(signup ? "/login" : "/signup")}>
        {t(signup ? "auth.toLogin" : "auth.toSignup")}
      </Link>
    </form>
  );
}
