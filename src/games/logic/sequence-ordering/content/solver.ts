import { permutations } from '@/games/logic/shared/content';
import { ordinal } from '@/games/logic/shared/content';
import type { OrderClue, OrderingContent } from './types';

export function clueHolds(clue: OrderClue, order: readonly string[]): boolean {
  const pos = (x: string) => order.indexOf(x);
  switch (clue.type) {
    case 'before':
      return pos(clue.a) < pos(clue.b);
    case 'right-before':
      return pos(clue.a) + 1 === pos(clue.b);
    case 'at':
      return pos(clue.a) === clue.position - 1;
    case 'not-at':
      return pos(clue.a) !== clue.position - 1;
    case 'gap':
      return Math.abs(pos(clue.a) - pos(clue.b)) === clue.between + 1;
    case 'next-to':
      return Math.abs(pos(clue.a) - pos(clue.b)) === 1;
    case 'not-next-to':
      return Math.abs(pos(clue.a) - pos(clue.b)) !== 1;
  }
}

/** Brute force: every order of the entities that satisfies all clues. */
export const solveOrders = (entities: readonly string[], clues: readonly OrderClue[]) =>
  permutations(entities).filter((order) => clues.every((c) => clueHolds(c, order)));

const WORDS = {
  race: {
    before: (a: string, b: string) => `${a} finished ahead of ${b}.`,
    rightBefore: (a: string, b: string) =>
      `${a} finished just ahead of ${b}, with nobody in between.`,
    at: (a: string, p: number, n: number) => `${a} finished ${p === n ? 'last' : ordinal(p)}.`,
    notAt: (a: string, p: number, n: number) =>
      `${a} did not finish ${p === n ? 'last' : ordinal(p)}.`,
    gap: (a: string, b: string, k: number) =>
      `Exactly ${k === 1 ? 'one runner' : `${k} runners`} finished between ${a} and ${b}.`,
    nextTo: (a: string, b: string) => `${a} and ${b} finished one right after the other.`,
    notNextTo: (a: string, b: string) => `${a} and ${b} did not finish one right after the other.`,
  },
  queue: {
    before: (a: string, b: string) => `${a} stands somewhere in front of ${b}.`,
    rightBefore: (a: string, b: string) => `${a} stands directly in front of ${b}.`,
    at: (a: string, p: number, n: number) =>
      `${a} is ${p === n ? 'last' : ordinal(p)} in the line.`,
    notAt: (a: string, p: number, n: number) =>
      `${a} is not ${p === n ? 'last' : ordinal(p)} in the line.`,
    gap: (a: string, b: string, k: number) =>
      `There ${k === 1 ? 'is exactly one person' : `are exactly ${k} people`} between ${a} and ${b}.`,
    nextTo: (a: string, b: string) => `${a} and ${b} stand next to each other.`,
    notNextTo: (a: string, b: string) => `${a} and ${b} do not stand next to each other.`,
  },
};

export function describeClue(clue: OrderClue, content: Pick<OrderingContent, 'kind' | 'entities'>) {
  const w = WORDS[content.kind];
  const n = content.entities.length;
  switch (clue.type) {
    case 'before':
      return w.before(clue.a, clue.b);
    case 'right-before':
      return w.rightBefore(clue.a, clue.b);
    case 'at':
      return w.at(clue.a, clue.position, n);
    case 'not-at':
      return w.notAt(clue.a, clue.position, n);
    case 'gap':
      return w.gap(clue.a, clue.b, clue.between);
    case 'next-to':
      return w.nextTo(clue.a, clue.b);
    case 'not-next-to':
      return w.notNextTo(clue.a, clue.b);
  }
}
