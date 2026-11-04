import { DEFAULT_LANGUAGE, isLanguage, matchLanguage, type Language } from './languages';

/**
 * The chosen language lives under its own key, apart from progress and preferences: it is needed
 * synchronously before the first paint, and resetting progress must not change the language.
 */
export const LANGUAGE_STORAGE_KEY = 'brainpractice.language';

/** Minimal storage surface, so tests and blocked-storage browsers can pass their own. */
export interface LanguageStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readStoredLanguage(storage: LanguageStorage | null): Language | null {
  try {
    const stored = storage?.getItem(LANGUAGE_STORAGE_KEY);
    // Older or hand-edited values ("es-ES", "EN") are normalised; anything else is ignored.
    return stored ? matchLanguage(stored) : null;
  } catch {
    return null;
  }
}

export function storeLanguage(storage: LanguageStorage | null, language: Language): void {
  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage blocked or full: the choice still applies for this visit.
  }
}

/**
 * Initial language, by priority: the person's explicit choice, then the first supported browser
 * language, then Spanish. Detection only runs when nothing was chosen, so it never overrides it.
 */
export function detectLanguage(
  stored: Language | null,
  browserLanguages: readonly string[] = [],
): Language {
  if (stored && isLanguage(stored)) return stored;
  for (const tag of browserLanguages) {
    const match = matchLanguage(tag);
    if (match) return match;
  }
  return DEFAULT_LANGUAGE;
}

/** The browser's localStorage, or null when it is unavailable (private modes, sandboxed frames). */
export function browserLanguageStorage(): LanguageStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages.length > 0 ? navigator.languages : [navigator.language];
}
