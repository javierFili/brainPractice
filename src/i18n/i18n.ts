import i18next, { type BackendModule, type Resource, type ResourceKey } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, type Language } from './languages';
import { storeLanguage, type LanguageStorage } from './preference';

/**
 * Translation namespaces, one JSON file per language each (`locales/<lang>/<ns>.json`). Every
 * namespace except the lazy ones loads with the language; the lazy ones load the first time a
 * screen asks for them (`useTranslation('lessons')`), and from then on with every language switch.
 */
export const NAMESPACES = [
  'common',
  'nav',
  'home',
  'catalog',
  'play',
  'progress',
  'assessment',
  'settings',
  'learn',
  'kit',
  'memory',
  'logic',
  'speed',
  'attention',
  'patterns',
  'programming',
] as const;

export const LAZY_NAMESPACES = ['lessons'] as const;

export type Namespace = (typeof NAMESPACES)[number] | (typeof LAZY_NAMESPACES)[number];

export const ALL_NAMESPACES: readonly Namespace[] = [...NAMESPACES, ...LAZY_NAMESPACES];

export const i18n = i18next.createInstance();

/** Keys that resolved in no language at all. Never shown (see `parseMissingKeyHandler`); tests read it. */
export const missingKeys = new Set<string>();

// Vite turns every locale file into its own chunk; only the active language's files are fetched.
const loaders = import.meta.glob<{ default: ResourceKey }>('./locales/*/*.json');

const lazyBackend: BackendModule = {
  type: 'backend',
  init: () => undefined,
  read(language, namespace, callback) {
    const load = loaders[`./locales/${language}/${namespace}.json`];
    if (!load) {
      callback(null, {});
      return;
    }
    load().then(
      (module) => {
        callback(null, module.default);
      },
      (error: unknown) => {
        callback(error instanceof Error ? error : new Error(String(error)), false);
      },
    );
  },
};

interface InitOptions {
  readonly language: Language;
  /** Preloaded resources (tests); without them, files are loaded lazily per language. */
  readonly resources?: Resource;
}

export async function initI18n({ language, resources }: InitOptions): Promise<void> {
  if (!resources) i18n.use(lazyBackend);
  i18n.use(initReactI18next);
  i18n.on('languageChanged', (lng) => {
    if (typeof document !== 'undefined') document.documentElement.lang = lng;
  });
  await i18n.init({
    lng: language,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: false,
    load: 'languageOnly',
    ns: [...NAMESPACES],
    defaultNS: 'common',
    ...(resources ? { resources, partialBundledLanguages: true } : {}),
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
    saveMissing: true,
    missingKeyHandler: (_languages, namespace, key) => {
      missingKeys.add(`${namespace}:${key}`);
    },
    // A key missing everywhere renders as nothing rather than as `games.memory.title`.
    parseMissingKeyHandler: () => '',
    react: { bindI18n: 'languageChanged loaded', useSuspense: true },
  });
}

/**
 * Switches the interface language in place: loads the new language's files first, then re-renders
 * whatever is mounted. Routes, sessions, timers and answers are untouched.
 */
export async function setLanguage(language: Language, storage: LanguageStorage | null) {
  storeLanguage(storage, language);
  await i18n.changeLanguage(language);
}

export const currentLanguage = (): Language => {
  const language = i18n.resolvedLanguage ?? i18n.language;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(language)
    ? (language as Language)
    : FALLBACK_LANGUAGE;
};
