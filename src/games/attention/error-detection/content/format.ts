import { msg, type Message, type Text } from '@/domain/shared';
import { objectsOf } from '@/games/kit/content';
import { inLanguages, localize } from './lexicon';
import type { ErrorDetectionContent, ErrorKind } from './types';

export const money = (cents: number, decimal = '.') =>
  `${cents < 0 ? '-' : ''}${Math.floor(Math.abs(cents) / 100)}${decimal}${String(Math.abs(cents) % 100).padStart(2, '0')}`;

/** An amount with the reader's decimal separator (1.25 in English, 1,25 elsewhere). */
export const moneyText = (cents: number): Message =>
  inLanguages(localize((language) => money(cents, language === 'en' ? '.' : ',')));

export const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const PRODUCT_LABELS = new Map(
  [...objectsOf('fruit'), ...objectsOf('food')].map((o) => [o.name, o.label]),
);

const row = (key: string, values: Parameters<typeof msg>[1]) =>
  msg(`attention:errorDetection.row.${key}`, values);

/** One printed text per row (the `locate` targets). */
export function rowTexts(content: ErrorDetectionContent): Text[] {
  switch (content.kind) {
    case 'sorted': {
      const { words } = content;
      if (words === null) return content.values.map(String);
      return words.en.map((_, i) => inLanguages(localize((language) => words[language][i] ?? '')));
    }
    case 'receipt': {
      const lines = content.lines.map((l) =>
        row('receipt', {
          quantity: String(l.quantity),
          item: PRODUCT_LABELS.get(l.item) ?? l.item,
          price: moneyText(l.priceCents),
          total: moneyText(l.totalCents),
        }),
      );
      return content.totalCents === null
        ? lines
        : [...lines, row('total', { total: moneyText(content.totalCents) })];
    }
    case 'schedule':
      return content.events.map((e) =>
        row('schedule', {
          start: clock(e.start),
          end: clock(e.end),
          activity: msg(`attention:errorDetection.activity.${e.activity}`),
          minutes: String(e.minutes),
        }),
      );
    case 'spelling': {
      const { words } = content;
      return words.en.map((_, i) => inLanguages(localize((language) => words[language][i] ?? '')));
    }
    case 'copy':
      return content.pairs.map((p) => `${p.original}  →  ${p.copy}`);
  }
}

/** The rule every row must follow, shown above the list. */
export function ruleText(content: ErrorDetectionContent): Message {
  const rule = (key: string) => msg(`attention:errorDetection.rule.${key}`);
  switch (content.kind) {
    case 'sorted':
      return rule(content.words === null ? 'sortedNumbers' : 'sortedWords');
    case 'receipt':
      return rule(content.totalCents === null ? 'receipt' : 'receiptWithTotal');
    case 'schedule':
      return rule('schedule');
    case 'spelling':
      return rule('spelling');
    case 'copy':
      return rule('copy');
  }
}

export const KIND_LABELS: Record<ErrorKind, Message> = {
  sorted: msg('attention:errorDetection.kinds.sorted'),
  receipt: msg('attention:errorDetection.kinds.receipt'),
  schedule: msg('attention:errorDetection.kinds.schedule'),
  spelling: msg('attention:errorDetection.kinds.spelling'),
  copy: msg('attention:errorDetection.kinds.copy'),
};
