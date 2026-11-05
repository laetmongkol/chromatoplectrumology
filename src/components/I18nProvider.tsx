"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { translate, type Messages, type Vars } from "@/lib/translate";

interface Ctx {
  locale: string;
  slug: string;
  messages: Messages;
}

const I18nContext = createContext<Ctx | null>(null);

/** Hands server-loaded messages to client components, and sets lang/dir on <html>. */
export function I18nProvider({ locale, slug, dir, messages, children }: { locale: string; slug: string; dir: "ltr" | "rtl"; messages: Messages; children: ReactNode }) {
  const value = useMemo(() => ({ locale, slug, messages }), [locale, slug, messages]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useCtx(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("Used outside <I18nProvider>");
  return ctx;
}

export function useT() {
  const { messages } = useCtx();
  return useCallback((key: string, vars?: Vars) => translate(messages, key, vars), [messages]);
}

export function useLocale(): string {
  return useCtx().locale;
}

/** Turns "/app" into "/jp/app" for the current language. */
export function useLocalePath() {
  const { slug } = useCtx();
  return useCallback((path: string) => `/${slug}${path === "/" ? "" : path}`, [slug]);
}
