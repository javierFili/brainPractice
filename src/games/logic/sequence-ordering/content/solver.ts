import { permutations } from '@/games/logic/shared/content';
import { msg, type Message } from '@/domain/shared';
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

/** "first" … or "last": the place wording depends on the story (race or line) and the language. */
const place = (kind: OrderingContent['kind'], p: number, n: number) =>
  msg(`logic:sequenceOrdering.place.${kind}.${p === n ? 'last' : String(p)}`);

export function describeClue(
  clue: OrderClue,
  content: Pick<OrderingContent, 'kind' | 'entities'>,
): Message {
  const n = content.entities.length;
  const key = (type: string) => `logic:sequenceOrdering.clue.${content.kind}.${type}`;
  switch (clue.type) {
    case 'before':
      return msg(key('before'), { a: clue.a, b: clue.b });
    case 'right-before':
      return msg(key('rightBefore'), { a: clue.a, b: clue.b });
    case 'at':
      return msg(key('at'), { a: clue.a, place: place(content.kind, clue.position, n) });
    case 'not-at':
      return msg(key('notAt'), { a: clue.a, place: place(content.kind, clue.position, n) });
    case 'gap':
      return msg(key('gap'), { a: clue.a, b: clue.b, count: clue.between });
    case 'next-to':
      return msg(key('nextTo'), { a: clue.a, b: clue.b });
    case 'not-next-to':
      return msg(key('notNextTo'), { a: clue.a, b: clue.b });
  }
}
