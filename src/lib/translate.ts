// Pure translation helpers shared by server and client code (no server-only imports here).

export type Messages = Record<string, string>;
export type Vars = Record<string, string | number>;

/** Looks up a key and fills {placeholders}. A key with no text anywhere is shown as the key itself, so gaps are easy to spot. */
export function translate(messages: Messages, key: string, vars?: Vars): string {
  const text = messages[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

export interface LanguageInfo {
  code: string;
  /** URL prefix, e.g. "jp" */
  slug: string;
  /** Country code for the flag icon, null = no flag */
  flag: string | null;
  nativeName: string;
  rtl: boolean;
  isDefault: boolean;
}
