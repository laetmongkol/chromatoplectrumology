"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { rememberLanguage } from "@/app/actions";
import Dropdown from "@/components/Dropdown";
import { useLocale, useT } from "@/components/I18nProvider";
import type { LanguageInfo } from "@/lib/translate";

/** Language picker with flags. Switching changes the first part of the address: /th/app becomes /jp/app. */
export default function LanguageSwitcher({ languages, tone = "dark" }: { languages: LanguageInfo[]; tone?: "dark" | "light" }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, start] = useTransition();

  const options = useMemo(() => languages.map((l) => ({ value: l.code, label: l.nativeName, flag: l.flag })), [languages]);

  return (
    <Dropdown
      compact
      alignRight
      tone={tone}
      ariaLabel={t("lang.label")}
      value={locale}
      options={options}
      onChange={(code) => {
        const target = languages.find((l) => l.code === code);
        if (!target || code === locale) return;
        const rest = pathname.split("/").slice(2).join("/");
        start(async () => {
          await rememberLanguage(target.slug);
          router.push(`/${target.slug}${rest ? `/${rest}` : ""}`);
        });
      }}
    />
  );
}
