import type { ErrorDetectionContent } from './types';
import { LANGUAGES, compareIn, isKnownWord, type Language } from './lexicon';

const inOrder = (values: readonly number[]) =>
  values.every((v, i) => i === 0 || (values[i - 1] as number) < v);

const inOrderIn = (language: Language, words: readonly string[]) =>
  words.every((w, i) => i === 0 || compareIn(language, words[i - 1] as string, w) < 0);

/** Rows wrong in any language (a word list is valid only when all languages agree). */
const acrossLanguages = (rowsIn: (language: Language) => number[]): number[] =>
  [...new Set(LANGUAGES.flatMap(rowsIn))].sort((a, b) => a - b);

const misplaced = <T>(items: readonly T[], sorted: (items: readonly T[]) => boolean): number[] =>
  sorted(items)
    ? []
    : items.flatMap((_, i) => (sorted(items.filter((__, j) => j !== i)) ? [i] : []));

/**
 * Every row that breaks the list's rule. For a sorted list, a row is "the error" when removing it
 * leaves the rest in order (an adjacent swap would give two such rows: ambiguous, rejected).
 */
export function findErrors(content: ErrorDetectionContent): number[] {
  switch (content.kind) {
    case 'sorted': {
      const { words } = content;
      if (words === null) return misplaced(content.values, inOrder);
      return acrossLanguages((language) =>
        misplaced(words[language], (list) => inOrderIn(language, list)),
      );
    }
    case 'receipt': {
      const bad = content.lines.flatMap((l, i) =>
        l.quantity * l.priceCents !== l.totalCents ? [i] : [],
      );
      if (content.totalCents !== null) {
        const sum = content.lines.reduce((s, l) => s + l.totalCents, 0);
        if (sum !== content.totalCents) bad.push(content.lines.length);
      }
      return bad;
    }
    case 'schedule':
      return content.events.flatMap((e, i) => (e.end - e.start !== e.minutes ? [i] : []));
    case 'spelling': {
      const { words } = content;
      return acrossLanguages((language) =>
        words[language].flatMap((w, i) => (isKnownWord(w, language) ? [] : [i])),
      );
    }
    case 'copy':
      return content.pairs.flatMap((p, i) => (p.original !== p.copy ? [i] : []));
  }
}
