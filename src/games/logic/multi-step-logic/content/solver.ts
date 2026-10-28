import { indexPermutations } from '@/games/logic/shared/content';
import type { Comparison, Fact, Question } from './types';

export function factHolds(f: Fact, v: readonly number[]): boolean {
  const at = (i: number) => v[i] as number;
  switch (f.type) {
    case 'value':
      return at(f.a) === f.v;
    case 'diff':
      return at(f.a) === at(f.b) + f.k;
    case 'times':
      return at(f.a) === f.k * at(f.b);
    case 'sum':
      return f.people.reduce((s, p) => s + at(p), 0) === f.total;
  }
}

export function answerOf(q: Question, v: readonly number[]): number {
  switch (q.type) {
    case 'value':
      return v[q.a] as number;
    case 'difference':
      return (v[q.a] as number) - (v[q.b] as number);
    case 'most':
    case 'least': {
      const target = q.type === 'most' ? Math.max(...v) : Math.min(...v);
      const who = v.flatMap((x, i) => (x === target ? [i] : []));
      return who.length === 1 ? (who[0] as number) : -1;
    }
  }
}

/**
 * Backtracking over every assignment of 1..max to each person, checking each fact as soon as its
 * people are known. Returns the set of distinct answers to `q` (stops once two are found) and the
 * number of solutions seen.
 */
export function solveNumbers(
  people: number,
  facts: readonly Fact[],
  q: Question,
  max: number,
): { answers: Set<number>; solutions: number; example: number[] | null } {
  const involved = (f: Fact) =>
    f.type === 'value' ? [f.a] : f.type === 'sum' ? [...f.people] : [f.a, f.b];
  const ready = Array.from({ length: people }, (_, i) =>
    facts.filter((f) => Math.max(...involved(f)) === i),
  );
  const v = new Array<number>(people).fill(0);
  const answers = new Set<number>();
  let solutions = 0;
  let example: number[] | null = null;
  const search = (i: number): void => {
    if (answers.size > 1) return;
    if (i === people) {
      solutions++;
      answers.add(answerOf(q, v));
      example ??= [...v];
      return;
    }
    for (let x = 1; x <= max; x++) {
      v[i] = x;
      if ((ready[i] as Fact[]).every((f) => factHolds(f, v))) search(i + 1);
    }
  };
  search(0);
  return { answers, solutions, example };
}

/** Every height order (rank per person) consistent with the comparisons. */
export function compareOrders(
  people: number,
  comparisons: readonly Comparison[],
): (readonly number[])[] {
  return indexPermutations(people).filter((rank) =>
    comparisons.every(({ a, b }) => (rank[a] as number) > (rank[b] as number)),
  );
}

/** A chain of comparisons from `from` down to `to` ("a > b > c"), found by breadth-first search. */
export function comparisonPath(
  comparisons: readonly Comparison[],
  from: number,
  to: number,
): number[] | null {
  const prev = new Map<number, number>([[from, from]]);
  let frontier = [from];
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const x of frontier)
      for (const { a, b } of comparisons)
        if (a === x && !prev.has(b)) {
          prev.set(b, x);
          next.push(b);
        }
    frontier = next;
  }
  if (!prev.has(to)) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0] as number) as number);
  return path;
}
