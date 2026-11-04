/**
 * Languages the interface is available in. Adding one = adding its code here, its native name and
 * a `locales/<code>/` folder with every namespace (see docs/i18n.md).
 */
export const SUPPORTED_LANGUAGES = ['es', 'en', 'it', 'fr', 'de'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** Used when nothing better is known (no stored choice, no supported browser language). */
export const DEFAULT_LANGUAGE: Language = 'es';

/**
 * Where a missing key is looked up before giving up. English is the source language every key is
 * written in first, so it is always complete.
 */
export const FALLBACK_LANGUAGE: Language = 'en';

/** Each language named in itself, so people find theirs whatever the current language is. */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
  es: 'Español',
  en: 'English',
  it: 'Italiano',
  fr: 'Français',
  de: 'Deutsch',
};

export const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

/** `de-AT` → `de`, `EN_us` → `en`; null when the base language is not supported. */
export function matchLanguage(tag: string): Language | null {
  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  return isLanguage(base) ? base : null;
}
