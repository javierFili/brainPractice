import { msg, type Message, type Text } from '@/domain/shared';
import { listText, sentenceText } from '@/games/logic/shared/content';
import type { Comparison, Fact, MultiStepContent, Question, Theme } from './types';

const key = (path: string) => `logic:multiStepLogic.${path}`;

/**
 * A fact as a clause without its full stop (the view adds it; the explanation builds on it).
 * Numbers go in as `count`, so "1 year" / "3 years" is chosen per language.
 */
export function describeFact(f: Fact, theme: Theme, names: readonly string[]): Message {
  const n = (i: number) => names[i] as string;
  const t = (path: string) => key(`fact.${theme}.${path}`);
  switch (f.type) {
    case 'value':
      return msg(t('value'), { a: n(f.a), count: f.v });
    case 'diff':
      return msg(t(f.flip ? 'less' : 'more'), { a: n(f.a), b: n(f.b), count: f.k });
    case 'times':
      return msg(t(f.flip ? `fraction${f.k}` : `times${f.k}`), { a: n(f.a), b: n(f.b) });
    case 'sum':
      return msg(t('sum'), { names: listText(f.people.map(n)), count: f.total });
  }
}

/** The fact as a sentence on its own. */
export const factSentence = (f: Fact, theme: Theme, names: readonly string[]): Text =>
  sentenceText(describeFact(f, theme, names));

export function describeQuestion(q: Question, theme: Theme, names: readonly string[]): Message {
  const n = (i: number) => names[i] as string;
  const t = (path: string) => key(`question.${theme}.${path}`);
  switch (q.type) {
    case 'value':
      return msg(t('value'), { a: n(q.a) });
    case 'difference':
      return msg(t('difference'), { a: n(q.a), b: n(q.b) });
    case 'most':
    case 'least':
      return msg(t(q.type));
  }
}

export const describeComparison = (
  { a, b }: Comparison,
  names: readonly string[],
  flip: boolean,
): Message =>
  flip
    ? msg(key('compare.shorter'), { a: names[b] as string, b: names[a] as string })
    : msg(key('compare.taller'), { a: names[a] as string, b: names[b] as string });

export const comparisonTexts = (content: Extract<MultiStepContent, { kind: 'compare' }>) =>
  content.comparisons.map((c, i) =>
    describeComparison(c, content.names, (c.a + c.b + i) % 3 === 0),
  );
