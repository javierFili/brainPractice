import type { i18n as I18n } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Text, TextValue } from '@/domain/shared';

const numberFormats = new Map<string, Intl.NumberFormat>();
const listFormats = new Map<string, Intl.ListFormat>();

const formatNumber = (language: string, value: number) => {
  let format = numberFormats.get(language);
  if (!format) {
    format = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
    numberFormats.set(language, format);
  }
  return format.format(value);
};

const formatList = (language: string, items: string[]) => {
  let format = listFormats.get(language);
  if (!format) {
    format = new Intl.ListFormat(language, { style: 'long', type: 'conjunction' });
    listFormats.set(language, format);
  }
  return format.format(items);
};

const resolveValue = (i18n: I18n, value: TextValue): string =>
  typeof value === 'number' ? formatNumber(i18n.language, value) : resolveText(i18n, value);

/**
 * Renders a `Text` in the current language. Nested messages are resolved first; numbers are
 * formatted for the language (1.234,5 in German); lists are joined. `count`, when numeric, also
 * selects the plural form (`key_one` / `key_other`).
 */
export function resolveText(i18n: I18n, text: Text): string {
  if (typeof text === 'string') return text;
  if ('list' in text) {
    const items = text.list.map((item) => resolveText(i18n, item));
    return text.separator === undefined
      ? formatList(i18n.language, items)
      : items.join(text.separator);
  }
  if (!text.values) return i18n.t(text.key);
  const values: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(text.values)) {
    values[name] = resolveValue(i18n, value);
  }
  const { count } = text.values;
  if (typeof count === 'number') values['count'] = count;
  return i18n.t(text.key, values);
}

/**
 * `const tx = useText(); tx(challenge.prompt)`. Components that call it re-render on a language
 * switch, so everything they show changes together.
 */
export function useText(): (text: Text) => string {
  const { i18n } = useTranslation();
  const { language } = i18n;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- language invalidates the resolver
  return useMemo(() => (text: Text) => resolveText(i18n, text), [i18n, language]);
}
