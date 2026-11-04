import type { Message } from '@/domain/shared';
import { indexPermutations } from '@/games/logic/shared/content';
import { categorySentence, subjectBy } from './categories';
import type { DeductionClue, DeductionContent } from './types';

/** A candidate table: one permutation per category; table[c][p] = value of person p. */
export type Table = readonly (readonly number[])[];

const universeCache = new Map<string, Table[]>();

/** Every possible table for `people` people and `categories` categories ((n!)^c tables). */
export function allTables(people: number, categories: number): Table[] {
  const key = `${people}x${categories}`;
  const cached = universeCache.get(key);
  if (cached) return cached;
  const perms = indexPermutations(people);
  let tables: Table[] = [[]];
  for (let c = 0; c < categories; c++) {
    tables = tables.flatMap((table) => perms.map((perm) => [...table, perm]));
  }
  universeCache.set(key, tables);
  return tables;
}

export function clueHolds(clue: DeductionClue, table: Table): boolean {
  switch (clue.type) {
    case 'is':
      return table[clue.category]?.[clue.person] === clue.value;
    case 'is-not':
      return table[clue.category]?.[clue.person] !== clue.value;
    case 'either': {
      const v = table[clue.category]?.[clue.person];
      return v === clue.values[0] || v === clue.values[1];
    }
    case 'link':
    case 'not-link': {
      const person = (table[clue.catA] as readonly number[]).indexOf(clue.a);
      const same = table[clue.catB]?.[person] === clue.b;
      return clue.type === 'link' ? same : !same;
    }
  }
}

const inverseCache = new Map<number, readonly (readonly number[])[]>();

/** inverse[perm][value] = person holding that value. */
function inverses(people: number) {
  let cached = inverseCache.get(people);
  if (!cached) {
    cached = indexPermutations(people).map((perm) => {
      const inv: number[] = [];
      perm.forEach((v, p) => (inv[v] = p));
      return inv;
    });
    inverseCache.set(people, cached);
  }
  return cached;
}

/** Brute force: every table that satisfies every clue. */
export function solveTables(
  people: number,
  categories: number,
  clues: readonly DeductionClue[],
): Table[] {
  return allTables(people, categories).filter((table) => clues.every((c) => clueHolds(c, table)));
}

export function describeClue(
  clue: DeductionClue,
  content: Pick<DeductionContent, 'people' | 'categories'>,
): Message {
  const cat = (c: number) => content.categories[c] as DeductionContent['categories'][number];
  const value = (c: number, v: number) => cat(c).values[v] as string;
  const person = (p: number) => content.people[p] as string;
  switch (clue.type) {
    case 'is':
    case 'is-not':
      return categorySentence(cat(clue.category).id, clue.type === 'is' ? 'is' : 'isNot', {
        subject: person(clue.person),
        value: value(clue.category, clue.value),
      });
    case 'either':
      return categorySentence(cat(clue.category).id, 'either', {
        subject: person(clue.person),
        a: value(clue.category, clue.values[0]),
        b: value(clue.category, clue.values[1]),
      });
    case 'link':
    case 'not-link':
      return categorySentence(cat(clue.catB).id, clue.type === 'link' ? 'is' : 'isNot', {
        subject: subjectBy(cat(clue.catA).id, value(clue.catA, clue.a)),
        value: value(clue.catB, clue.b),
      });
  }
}

type LinkClue = Extract<DeductionClue, { type: 'link' | 'not-link' }>;
type UnaryClue = Exclude<DeductionClue, LinkClue>;
const isLink = (clue: DeductionClue): clue is LinkClue =>
  clue.type === 'link' || clue.type === 'not-link';

interface Indexed {
  readonly people: number;
  readonly perms: Uint8Array;
  readonly inverse: Uint8Array;
  /** byCategory[c][t] = permutation index used by table t in category c. */
  readonly byCategory: readonly Uint8Array[];
  readonly size: number;
  /** Every table id, 0..size-1. */
  readonly all: Int32Array;
}

const indexedCache = new Map<string, Indexed>();

/** Typed-array view of every table, for fast filtering while clues are added. */
export function indexedTables(people: number, categories: number): Indexed {
  const key = `${people}x${categories}`;
  const cached = indexedCache.get(key);
  if (cached) return cached;
  const list = indexPermutations(people);
  const p = list.length;
  const perms = new Uint8Array(list.flat());
  const inverse = new Uint8Array(inverses(people).flat());
  const size = p ** categories;
  const byCategory = Array.from({ length: categories }, (_, c) => {
    const stride = p ** (categories - 1 - c);
    const column = new Uint8Array(size);
    for (let t = 0; t < size; t++) column[t] = Math.floor(t / stride) % p;
    return column;
  });
  const all = new Int32Array(size);
  for (let t = 0; t < size; t++) all[t] = t;
  const indexed = { people, perms, inverse, byCategory, size, all };
  indexedCache.set(key, indexed);
  return indexed;
}

/** The table with the given id, as in `indexedTables`. */
export function tableAt(ix: Indexed, t: number): Table {
  return ix.byCategory.map((column) => {
    const i = column[t] as number;
    return [...ix.perms.subarray(i * ix.people, (i + 1) * ix.people)];
  });
}

/** Keeps the table ids (from `left`) that satisfy the clue. */
export function filterTables(ix: Indexed, left: Int32Array, clue: DeductionClue): Int32Array {
  const n = ix.people;
  const out = new Int32Array(left.length);
  let k = 0;
  if (isLink(clue)) {
    const colA = ix.byCategory[clue.catA] as Uint8Array;
    const colB = ix.byCategory[clue.catB] as Uint8Array;
    const want = clue.type === 'link';
    for (let x = 0; x < left.length; x++) {
      const t = left[x] as number;
      const person = ix.inverse[(colA[t] as number) * n + clue.a] as number;
      if ((ix.perms[(colB[t] as number) * n + person] === clue.b) === want) out[k++] = t;
    }
  } else {
    const unary: UnaryClue = clue;
    const p = ix.perms.length / n;
    const mask = new Uint8Array(p);
    for (let i = 0; i < p; i++) {
      const v = ix.perms[i * n + unary.person];
      mask[i] =
        unary.type === 'is'
          ? Number(v === unary.value)
          : unary.type === 'is-not'
            ? Number(v !== unary.value)
            : Number(v === unary.values[0] || v === unary.values[1]);
    }
    const col = ix.byCategory[unary.category] as Uint8Array;
    for (let x = 0; x < left.length; x++) {
      const t = left[x] as number;
      if (mask[col[t] as number] === 1) out[k++] = t;
    }
  }
  return out.slice(0, k);
}

/**
 * Drops every clue the others make redundant, keeping the solution unique. For each table it
 * tracks how many kept clues it breaks and the XOR of their numbers: a table breaking exactly one
 * clue names it, so "is clue i needed?" is a lookup instead of a new search.
 */
export function minimizeClues(ix: Indexed, clues: readonly DeductionClue[]): DeductionClue[] {
  const { all } = ix;
  const broken = new Uint8Array(ix.size);
  const xor = new Uint8Array(ix.size);
  const passes = clues.map((clue) => {
    const ok = new Uint8Array(ix.size);
    const pass = filterTables(ix, all, clue);
    for (let x = 0; x < pass.length; x++) ok[pass[x] as number] = 1;
    return ok;
  });
  passes.forEach((ok, j) => {
    for (let t = 0; t < ix.size; t++)
      if (ok[t] === 0) {
        broken[t] = (broken[t] as number) + 1;
        xor[t] = (xor[t] as number) ^ (j + 1);
      }
  });
  const kept = clues.map(() => true);
  for (let i = clues.length - 1; i >= 0; i--) {
    let needed = false;
    for (let t = 0; t < ix.size && !needed; t++) needed = broken[t] === 1 && xor[t] === i + 1;
    if (needed) continue;
    kept[i] = false;
    const ok = passes[i] as Uint8Array;
    for (let t = 0; t < ix.size; t++)
      if (ok[t] === 0) {
        broken[t] = (broken[t] as number) - 1;
        xor[t] = (xor[t] as number) ^ (i + 1);
      }
  }
  return clues.filter((_, i) => kept[i]);
}
