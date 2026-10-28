import { capitalize } from '@/games/logic/shared/content';
import type { Comparison, Fact, MultiStepContent, Question, Theme } from './types';

const TIMES = ['', '', 'twice', 'three times'] as const;
const FRACTION = ['', '', 'half', 'a third'] as const;

export function describeFact(f: Fact, theme: Theme, names: readonly string[]): string {
  const n = (i: number) => names[i] as string;
  const ages = theme === 'ages';
  switch (f.type) {
    case 'value':
      return ages ? `${n(f.a)} is ${f.v} years old.` : `${n(f.a)} has ${f.v} marbles.`;
    case 'diff':
      if (ages)
        return f.flip
          ? `${n(f.b)} is ${f.k} ${f.k === 1 ? 'year' : 'years'} younger than ${n(f.a)}.`
          : `${n(f.a)} is ${f.k} ${f.k === 1 ? 'year' : 'years'} older than ${n(f.b)}.`;
      return f.flip
        ? `${n(f.b)} has ${f.k} fewer ${f.k === 1 ? 'marble' : 'marbles'} than ${n(f.a)}.`
        : `${n(f.a)} has ${f.k} more ${f.k === 1 ? 'marble' : 'marbles'} than ${n(f.b)}.`;
    case 'times':
      if (ages)
        return f.flip
          ? `${n(f.b)} is ${FRACTION[f.k] as string} as old as ${n(f.a)}.`
          : `${n(f.a)} is ${TIMES[f.k] as string} as old as ${n(f.b)}.`;
      return f.flip
        ? `${n(f.b)} has ${FRACTION[f.k] as string} as many marbles as ${n(f.a)}.`
        : `${n(f.a)} has ${TIMES[f.k] as string} as many marbles as ${n(f.b)}.`;
    case 'sum': {
      const who = f.people.map(n);
      const list =
        who.length === 2
          ? `${who[0] as string} and ${who[1] as string}`
          : `${who.slice(0, -1).join(', ')} and ${who.at(-1) as string}`;
      return ages
        ? `${capitalize(list)} are ${f.total} years old in total.`
        : `${capitalize(list)} have ${f.total} marbles in total.`;
    }
  }
}

export function describeQuestion(q: Question, theme: Theme, names: readonly string[]): string {
  const n = (i: number) => names[i] as string;
  const ages = theme === 'ages';
  switch (q.type) {
    case 'value':
      return ages ? `How old is ${n(q.a)}?` : `How many marbles does ${n(q.a)} have?`;
    case 'difference':
      return ages
        ? `How many years older is ${n(q.a)} than ${n(q.b)}?`
        : `How many more marbles does ${n(q.a)} have than ${n(q.b)}?`;
    case 'most':
      return ages ? 'Who is the oldest?' : 'Who has the most marbles?';
    case 'least':
      return ages ? 'Who is the youngest?' : 'Who has the fewest marbles?';
  }
}

export const describeComparison = (
  { a, b }: Comparison,
  names: readonly string[],
  flip: boolean,
) =>
  flip
    ? `${names[b] as string} is shorter than ${names[a] as string}.`
    : `${names[a] as string} is taller than ${names[b] as string}.`;

export const comparisonTexts = (content: Extract<MultiStepContent, { kind: 'compare' }>) =>
  content.comparisons.map((c, i) =>
    describeComparison(c, content.names, (c.a + c.b + i) % 3 === 0),
  );
