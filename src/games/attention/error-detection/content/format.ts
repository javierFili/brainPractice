import type { ErrorDetectionContent, ErrorKind } from './types';

export const money = (cents: number) =>
  `${cents < 0 ? '-' : ''}${Math.floor(Math.abs(cents) / 100)}.${String(Math.abs(cents) % 100).padStart(2, '0')}`;

export const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** One printed text per row (the `locate` targets). */
export function rowTexts(content: ErrorDetectionContent): string[] {
  switch (content.kind) {
    case 'sorted':
      return content.values.map(String);
    case 'receipt': {
      const lines = content.lines.map(
        (l) => `${l.quantity} × ${l.item} @ ${money(l.priceCents)} = ${money(l.totalCents)}`,
      );
      return content.totalCents === null
        ? lines
        : [...lines, `TOTAL = ${money(content.totalCents)}`];
    }
    case 'schedule':
      return content.events.map(
        (e) => `${clock(e.start)}–${clock(e.end)}  ${e.activity} (${e.minutes} min)`,
      );
    case 'spelling':
      return [...content.words];
    case 'copy':
      return content.pairs.map((p) => `${p.original}  →  ${p.copy}`);
  }
}

/** The rule every row must follow, shown above the list. */
export function ruleText(content: ErrorDetectionContent): string {
  switch (content.kind) {
    case 'sorted':
      return typeof content.values[0] === 'number'
        ? 'The numbers should go from smallest to largest. One is out of place.'
        : 'The words should be in alphabetical order. One is out of place.';
    case 'receipt':
      return content.totalCents === null
        ? 'Each line: quantity × price = line total. One line is wrong.'
        : 'Each line: quantity × price = line total, and TOTAL is the sum of the lines. One row is wrong.';
    case 'schedule':
      return 'Each slot states its length in minutes. One length does not match its times.';
    case 'spelling':
      return 'Every word is a common English word. One is misspelt.';
    case 'copy':
      return 'Each code on the right should be an exact copy of the one on the left. One copy is wrong.';
  }
}

export const KIND_LABELS: Record<ErrorKind, string> = {
  sorted: 'Sorted list',
  receipt: 'Receipt',
  schedule: 'Schedule',
  spelling: 'Spelling',
  copy: 'Copied codes',
};
