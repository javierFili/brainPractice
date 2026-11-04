import { msg, type Message } from '@/domain/shared';
import type { ListOp, ListOpName } from '../types';
import type { ProgramSpace } from './programSpace';

type List = readonly number[];

export function applyListOp(op: ListOp, list: List): List {
  switch (op.op) {
    case 'reverse':
      return [...list].reverse();
    case 'sort-ascending':
      return [...list].sort((a, b) => a - b);
    case 'sort-descending':
      return [...list].sort((a, b) => b - a);
    case 'rotate-left':
      return list.length === 0 ? list : [...list.slice(1), list[0] as number];
    case 'rotate-right':
      return list.length === 0 ? list : [list.at(-1) as number, ...list.slice(0, -1)];
    case 'drop-first':
      return list.slice(1);
    case 'drop-last':
      return list.slice(0, -1);
    case 'duplicate-each':
      return list.flatMap((x) => [x, x]);
    case 'add':
      return list.map((x) => x + op.amount);
    case 'double':
      return list.map((x) => x * 2);
    case 'keep-even':
      return list.filter((x) => x % 2 === 0);
    case 'keep-odd':
      return list.filter((x) => x % 2 !== 0);
    case 'take-first':
      return list.slice(0, op.count);
    case 'swap-pairs':
      return list.map((_, i) => {
        const partner = i % 2 === 0 ? i + 1 : i - 1;
        return (partner < list.length ? list[partner] : list[i]) as number;
      });
    case 'remove-repeats':
      return list.filter((x, i) => list.indexOf(x) === i);
    case 'running-total': {
      let total = 0;
      return list.map((x) => (total += x));
    }
  }
}

/** Every concrete operation the player may assume (the vocabulary shown in the challenge). */
export const LIST_OP_CATALOG: readonly ListOp[] = [
  { op: 'reverse' },
  { op: 'sort-ascending' },
  { op: 'sort-descending' },
  { op: 'rotate-left' },
  { op: 'rotate-right' },
  { op: 'drop-first' },
  { op: 'drop-last' },
  { op: 'duplicate-each' },
  { op: 'add', amount: 1 },
  { op: 'add', amount: 2 },
  { op: 'add', amount: 3 },
  { op: 'double' },
  { op: 'keep-even' },
  { op: 'keep-odd' },
  { op: 'take-first', count: 2 },
  { op: 'take-first', count: 3 },
  { op: 'swap-pairs' },
  { op: 'remove-repeats' },
  { op: 'running-total' },
];

export const catalogOps = (names: readonly ListOpName[]) =>
  LIST_OP_CATALOG.filter((op) => names.includes(op.op));

export const formatList = (list: List) => `[${list.join(', ')}]`;

export const LIST_SPACE: ProgramSpace<List, ListOp> = {
  operations: LIST_OP_CATALOG,
  apply: applyListOp,
  key: formatList,
};

const OP = 'programming:patternArchitect.listOp';

export function describeListOp(op: ListOp): Message {
  switch (op.op) {
    case 'add':
      return msg(`${OP}.add`, { n: String(op.amount) });
    case 'take-first':
      return msg(`${OP}.takeFirst`, { count: op.count });
    default:
      return msg(`${OP}.${LIST_OP_KEYS[op.op]}`);
  }
}

const LIST_OP_KEYS: Readonly<Record<Exclude<ListOpName, 'add' | 'take-first'>, string>> = {
  reverse: 'reverse',
  'sort-ascending': 'sortAscending',
  'sort-descending': 'sortDescending',
  'rotate-left': 'rotateLeft',
  'rotate-right': 'rotateRight',
  'drop-first': 'dropFirst',
  'drop-last': 'dropLast',
  'duplicate-each': 'duplicateEach',
  double: 'double',
  'keep-even': 'keepEven',
  'keep-odd': 'keepOdd',
  'swap-pairs': 'swapPairs',
  'remove-repeats': 'removeRepeats',
  'running-total': 'runningTotal',
};

/** The vocabulary grouped for display (parameterised operations described once). */
export const LIST_VOCABULARY: readonly Message[] = [
  'reverse',
  'sort',
  'rotate',
  'drop',
  'duplicateEach',
  'add',
  'double',
  'keepParity',
  'takeFirst',
  'swapPairs',
  'removeRepeats',
  'runningTotal',
].map((key) => msg(`programming:patternArchitect.vocabulary.${key}`));

const same = (a: ListOp, b: ListOp) => JSON.stringify(a) === JSON.stringify(b);

/** Look-alike operations, for "almost the right step" distractors. */
export function siblingsOf(op: ListOp): ListOp[] {
  const pairs: [ListOpName, ListOpName][] = [
    ['sort-ascending', 'sort-descending'],
    ['rotate-left', 'rotate-right'],
    ['drop-first', 'drop-last'],
    ['keep-even', 'keep-odd'],
    ['reverse', 'sort-descending'],
    ['double', 'duplicate-each'],
  ];
  const named = pairs.flatMap(([a, b]) =>
    op.op === a ? [b] : op.op === b ? [a] : ([] as ListOpName[]),
  );
  const byName = LIST_OP_CATALOG.filter((candidate) => named.includes(candidate.op));
  const sameFamily = LIST_OP_CATALOG.filter(
    (candidate) => candidate.op === op.op && !same(candidate, op),
  );
  return [...sameFamily, ...byName];
}
