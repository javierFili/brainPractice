import { msg, joinText } from '@/domain/shared';
import { glyphLabel, wordLabel } from '@/games/kit/content';
import { ALL_RESOURCES } from '@/test/i18n';
import { formatterFor } from './format';
import { i18n, missingKeys } from './i18n';
import { DEFAULT_LANGUAGE, matchLanguage, SUPPORTED_LANGUAGES } from './languages';
import {
  detectLanguage,
  LANGUAGE_STORAGE_KEY,
  readStoredLanguage,
  storeLanguage,
} from './preference';
import { resolveText } from './text';

describe('language detection', () => {
  it('normalises tags and rejects unsupported languages', () => {
    expect(matchLanguage('de-AT')).toBe('de');
    expect(matchLanguage('FR_ca')).toBe('fr');
    expect(matchLanguage('pt-BR')).toBeNull();
    expect(matchLanguage('')).toBeNull();
  });

  it('prefers the stored choice, then the browser, then Spanish', () => {
    expect(detectLanguage('it', ['de-DE'])).toBe('it');
    expect(detectLanguage(null, ['pt-BR', 'fr-FR', 'en'])).toBe('fr');
    expect(detectLanguage(null, ['ja', 'zh'])).toBe(DEFAULT_LANGUAGE);
    expect(detectLanguage(null, [])).toBe('es');
  });

  it('reads old or hand-edited stored values safely', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    };
    expect(readStoredLanguage(storage)).toBeNull();
    store.set(LANGUAGE_STORAGE_KEY, 'EN-gb');
    expect(readStoredLanguage(storage)).toBe('en');
    store.set(LANGUAGE_STORAGE_KEY, 'klingon');
    expect(readStoredLanguage(storage)).toBeNull();
    storeLanguage(storage, 'de');
    expect(readStoredLanguage(storage)).toBe('de');
    expect(readStoredLanguage(null)).toBeNull();
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readStoredLanguage(throwing)).toBeNull();
    expect(() => {
      storeLanguage(throwing, 'fr');
    }).not.toThrow();
  });
});

describe('text resolution', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('keeps literal strings untouched', () => {
    expect(resolveText(i18n, 'x = x + 1')).toBe('x = x + 1');
  });

  it('agrees colour adjectives with each language’s shape nouns', async () => {
    const star = glyphLabel({ shape: 'star', color: 'red' });
    const circle = glyphLabel({ shape: 'circle', color: 'red' });
    const expected = {
      en: ['red star', 'red circle'],
      es: ['estrella roja', 'círculo rojo'],
      it: ['stella rossa', 'cerchio rosso'],
      fr: ['étoile rouge', 'cercle rouge'],
      de: ['roter Stern', 'roter Kreis'],
    };
    for (const language of SUPPORTED_LANGUAGES) {
      await i18n.changeLanguage(language);
      expect([resolveText(i18n, star), resolveText(i18n, circle)]).toEqual(expected[language]);
    }
    await i18n.changeLanguage('de');
    expect(resolveText(i18n, glyphLabel({ shape: 'diamond', color: 'blue' }))).toBe('blaue Raute');
    expect(resolveText(i18n, glyphLabel({ shape: 'heart', color: 'green' }))).toBe('grünes Herz');
  });

  it('resolves nested messages, plurals, number formats and lists per language', async () => {
    const misses = (count: number) => msg('common:describe.misses', { count });
    expect(resolveText(i18n, misses(1))).toBe('1 miss');
    expect(resolveText(i18n, misses(3))).toBe('3 misses');
    await i18n.changeLanguage('fr');
    // French uses the singular for 0 and 1.
    expect(resolveText(i18n, misses(0))).toBe('0 erreur');
    await i18n.changeLanguage('de');
    expect(resolveText(i18n, msg('common:describe.number', { value: 1234.5 }))).toBe('1.234,5');
    expect(resolveText(i18n, joinText([wordLabel('apple'), wordLabel('bread')]))).toBe(
      'Apfel und Brot',
    );
    expect(resolveText(i18n, joinText(['a', 'b'], ' → '))).toBe('a → b');
  });

  it('never shows an internal key when a translation is missing', () => {
    missingKeys.clear();
    expect(resolveText(i18n, msg('games:does.not.exist'))).toBe('');
    expect(missingKeys.size).toBe(1);
    missingKeys.clear();
  });
});

describe('formats', () => {
  it('formats numbers, percentages, durations and dates for each language', () => {
    const at = Date.UTC(2026, 9, 3, 12);
    expect(formatterFor('en').percent(0.853)).toBe('85%');
    expect(formatterFor('de').percent(0.853)).toMatch(/^85\s%$/);
    expect(formatterFor('fr').points(12345)).toMatch(/^12\s345$/);
    expect(formatterFor('es').ms(1250)).toBe('1,25 s');
    expect(formatterFor('en').ms(850)).toBe('850 ms');
    expect(formatterFor('it').duration(65 * 60_000)).toMatch(/^1 h(?:r)? 05 min$/);
    expect(formatterFor('de').duration(12 * 60_000)).toBe('12 Min.');
    expect(formatterFor('es').date(at)).toContain('2026');
    expect(formatterFor('fr').relativeDay(at, at + 86_400_000)).toBe('hier');
    expect(formatterFor('es').relativeDay(at, at)).toBe('hoy');
    expect(formatterFor('en').seconds(null, 'No limit')).toBe('No limit');
  });
});

describe('locale files', () => {
  const flatten = (value: unknown, prefix = ''): string[] =>
    typeof value === 'object' && value !== null
      ? Object.entries(value).flatMap(([key, inner]) =>
          flatten(inner, prefix ? `${prefix}.${key}` : key),
        )
      : [prefix];
  /** `key_one` and `key_other` are one key; languages choose their own plural forms. */
  const base = (key: string) => key.replace(/_(zero|one|two|few|many|other)$/, '');

  it('gives every language every key of the source language (English)', () => {
    const english = ALL_RESOURCES['en'] ?? {};
    for (const language of SUPPORTED_LANGUAGES) {
      const resources = ALL_RESOURCES[language] ?? {};
      for (const [namespace, bundle] of Object.entries(english)) {
        const have = new Set(flatten(resources[namespace]).map(base));
        const missing = flatten(bundle)
          .map(base)
          .filter((key) => key !== '' && !have.has(key));
        expect(missing, `${language}/${namespace}.json`).toEqual([]);
      }
    }
  });

  it('has no empty, placeholder or untranslated-marker values', () => {
    for (const language of SUPPORTED_LANGUAGES) {
      for (const [namespace, bundle] of Object.entries(ALL_RESOURCES[language] ?? {})) {
        const walk = (value: unknown, path: string): void => {
          if (typeof value === 'string') {
            expect(value.trim(), `${language}/${namespace}:${path}`).not.toBe('');
            expect(value, `${language}/${namespace}:${path}`).not.toMatch(
              /\bTODO\b|\bFIXME\b|Translation pending/,
            );
            return;
          }
          if (typeof value === 'object' && value !== null) {
            for (const [key, inner] of Object.entries(value)) walk(inner, `${path}.${key}`);
          }
        };
        walk(bundle, '');
      }
    }
  });

  it('gives every kit word a unique translation in every language', async () => {
    for (const language of SUPPORTED_LANGUAGES) {
      await i18n.changeLanguage(language);
      const words = Object.keys(
        (ALL_RESOURCES['en']?.['kit'] as { words: object } | undefined)?.words ?? {},
      ).map((word) => resolveText(i18n, wordLabel(word)).toLowerCase());
      expect(new Set(words).size, language).toBe(words.length);
    }
    await i18n.changeLanguage('en');
  });
});
