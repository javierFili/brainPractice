import { ALL_WORDS } from '@/games/kit/content';
import type { ErrorDetectionContent } from './types';

const DICTIONARY = new Set(ALL_WORDS);

const inOrder = (values: readonly (number | string)[]) =>
  values.every((v, i) => i === 0 || (values[i - 1] as number | string) < v);

/**
 * Every row that breaks the list's rule. For a sorted list, a row is "the error" when removing it
 * leaves the rest in order (an adjacent swap would give two such rows: ambiguous, rejected).
 */
export function findErrors(content: ErrorDetectionContent): number[] {
  switch (content.kind) {
    case 'sorted': {
      const { values } = content;
      if (inOrder(values)) return [];
      return values.flatMap((_, i) => (inOrder(values.filter((__, j) => j !== i)) ? [i] : []));
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
    case 'spelling':
      return content.words.flatMap((w, i) => (DICTIONARY.has(w) ? [] : [i]));
    case 'copy':
      return content.pairs.flatMap((p, i) => (p.original !== p.copy ? [i] : []));
  }
}

export const isKnownWord = (word: string) => DICTIONARY.has(word);
