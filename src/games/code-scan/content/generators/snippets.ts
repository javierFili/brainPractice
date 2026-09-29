import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import type { CodeLine, CodeScanProfile, Snippet, Token } from '../types';

/**
 * Name pools. No two names are within one edit of each other, none contains a digit or a
 * look-alike pair (rn, cl, vv), so every change is a semantic token, never a font trick.
 */
export const SCALARS = [
  'total',
  'count',
  'price',
  'limit',
  'offset',
  'amount',
  'balance',
  'score',
  'width',
  'height',
  'rate',
  'start',
  'step',
  'delta',
  'budget',
  'stock',
  'quota',
  'bonus',
  'speed',
  'margin',
] as const;
export const ARRAYS = ['items', 'costs', 'values', 'orders', 'grades', 'queue'] as const;
export const INDICES = ['i', 'j'] as const;
export const ROUTINES = ['send', 'append', 'print', 'save', 'notify', 'update'] as const;
const EXTREMA = ['max', 'min'] as const;

export type NameRole = 'scalar' | 'array' | 'index';

const ARRAY_SET: ReadonlySet<string> = new Set(ARRAYS);
const INDEX_SET: ReadonlySet<string> = new Set(INDICES);

/** Role of a `name` token: only names of the same role are swapped with each other. */
export const roleOf = (name: string): NameRole =>
  ARRAY_SET.has(name) ? 'array' : INDEX_SET.has(name) ? 'index' : 'scalar';

// ── Token helpers ─────────────────────────────────────────────────────────────────────────────────

const kw = (text: string): Token => ({ type: 'keyword', text });
const nm = (text: string): Token => ({ type: 'name', text });
const fn = (text: string): Token => ({ type: 'func', text });
const num = (value: number): Token => ({ type: 'number', text: String(value) });
const op = (text: string): Token => ({ type: 'operator', text });
const pu = (text: string): Token => ({ type: 'punct', text });
const ASSIGN = pu('←');

const ARITHMETIC = ['+', '-', '*'] as const;
const COMPARISONS = ['<', '<=', '>', '>=', '=', '≠'] as const;

interface Scope {
  readonly random: RandomGenerator;
  readonly scalars: readonly string[];
  readonly arrays: readonly string[];
  readonly complexity: CodeScanProfile['complexity'];
  /** Index of the enclosing `for` loop; array accesses inside the loop use it. */
  readonly index?: string;
}

const scalar = (s: Scope) => pick(s.random, s.scalars);
/** Loop index, biased towards `i` so `i` / `j` swaps stay a real near miss. */
const loopIndex = (s: Scope) => s.index ?? (chance(s.random, 0.7) ? 'i' : 'j');
const indexed = (s: Scope): Token[] => [
  nm(pick(s.random, s.arrays)),
  pu('['),
  nm(loopIndex(s)),
  pu(']'),
];

/** A variable, a small literal or an array element. */
function atom(s: Scope): Token[] {
  const roll = randomInt(s.random, 0, 2);
  if (roll === 0) return [nm(scalar(s))];
  if (roll === 1) return [num(randomInt(s.random, 1, 9))];
  return indexed(s);
}

function comparison(s: Scope): Token[] {
  const left = chance(s.random, 0.7) ? [nm(scalar(s))] : indexed(s);
  const right = chance(s.random, 0.5) ? [nm(scalar(s))] : [num(randomInt(s.random, 0, 20))];
  return [...left, op(pick(s.random, COMPARISONS)), ...right];
}

/** Compound conditions (`a < b and c > 0`) only appear once nesting is allowed. */
function condition(s: Scope): Token[] {
  if (s.complexity === 1 || chance(s.random, 0.6)) return comparison(s);
  return [...comparison(s), op(pick(s.random, ['and', 'or'] as const)), ...comparison(s)];
}

// ── Statements (one line each) ────────────────────────────────────────────────────────────────────

const STATEMENTS: readonly ((s: Scope) => Token[])[] = [
  // total ← 0
  (s) => [nm(scalar(s)), ASSIGN, num(randomInt(s.random, 0, 12))],
  // total ← total + price
  (s) => {
    const target = scalar(s);
    return [nm(target), ASSIGN, nm(target), op(pick(s.random, ARITHMETIC)), ...atom(s)];
  },
  // total ← price * 3
  (s) => [nm(scalar(s)), ASSIGN, ...atom(s), op(pick(s.random, ARITHMETIC)), ...atom(s)],
  // items[i] ← limit - 2
  (s) => [
    ...indexed(s),
    ASSIGN,
    nm(scalar(s)),
    op(pick(s.random, ARITHMETIC)),
    num(randomInt(s.random, 1, 9)),
  ],
  // send(total, items[i])
  (s) => [fn(pick(s.random, ROUTINES)), pu('('), nm(scalar(s)), pu(','), ...atom(s), pu(')')],
  // best ← max(best, items[i])
  (s) => {
    const target = scalar(s);
    return [
      nm(target),
      ASSIGN,
      fn(pick(s.random, EXTREMA)),
      pu('('),
      nm(target),
      pu(','),
      ...indexed(s),
      pu(')'),
    ];
  },
];

const statement = (s: Scope, indent: number): CodeLine => ({
  indent,
  tokens: pick(s.random, STATEMENTS)(s),
});

// ── Blocks ────────────────────────────────────────────────────────────────────────────────────────

interface Block {
  readonly lines: readonly CodeLine[];
  /** Offsets (within the block) of lines that belong to a run of near-identical lines. */
  readonly runOffsets: readonly number[];
}

const plain = (lines: readonly CodeLine[]): Block => ({ lines, runOffsets: [] });

const body = (s: Scope, indent: number, size: number) =>
  Array.from({ length: size }, () => statement(s, indent));

function ifBlock(s: Scope, indent: number, bodySize: number): CodeLine[] {
  return [
    { indent, tokens: [kw('if'), ...condition(s), kw('then')] },
    ...body(s, indent + 1, bodySize),
    { indent, tokens: [kw('end'), kw('if')] },
  ];
}

function ifElseBlock(s: Scope, indent: number): CodeLine[] {
  return [
    { indent, tokens: [kw('if'), ...condition(s), kw('then')] },
    statement(s, indent + 1),
    { indent, tokens: [kw('else')] },
    statement(s, indent + 1),
    { indent, tokens: [kw('end'), kw('if')] },
  ];
}

function forHeader(s: Scope, indent: number, index: string): CodeLine {
  const bound = chance(s.random, 0.5)
    ? [nm(scalar(s)), op('-'), num(1)]
    : [num(randomInt(s.random, 3, 12))];
  return {
    indent,
    tokens: [
      kw('for'),
      nm(index),
      ASSIGN,
      num(randomInt(s.random, 0, 1)),
      kw('to'),
      ...bound,
      kw('do'),
    ],
  };
}

/** `for` loop; with nesting allowed its body may hold an `if` block. */
function forBlock(s: Scope, indent: number, maxSize: number): CodeLine[] {
  const index = loopIndex(s);
  const inside: Scope = { ...s, index };
  const nested = s.complexity === 2 && maxSize >= 5 && chance(s.random, 0.5);
  const inner = nested
    ? ifBlock(inside, indent + 1, 1)
    : body(inside, indent + 1, Math.min(randomInt(s.random, 1, 2), maxSize - 2));
  return [forHeader(s, indent, index), ...inner, { indent, tokens: [kw('end'), kw('for')] }];
}

function whileBlock(s: Scope, indent: number, maxSize: number): CodeLine[] {
  return [
    { indent, tokens: [kw('while'), ...comparison(s), kw('do')] },
    ...body(s, indent + 1, Math.min(randomInt(s.random, 1, 2), maxSize - 2)),
    { indent, tokens: [kw('end'), kw('while')] },
  ];
}

/**
 * Visual noise: consecutive lines that share one template and differ in a single slot, e.g.
 * `width ← width + step` / `height ← height + step`, or `prices[0] ← base * 2` / `prices[1] ← …`.
 */
function runBlock(s: Scope, indent: number, size: number): Block {
  const template = randomInt(s.random, 0, 2);
  const shared = pick(s.random, s.scalars);
  const operator = pick(s.random, ARITHMETIC);
  const amount = randomInt(s.random, 1, 9);
  const array = pick(s.random, s.arrays);
  const routine = pick(s.random, ROUTINES);
  const targets = sample(
    s.random,
    s.scalars.filter((name) => name !== shared),
    size,
  );
  const lines = Array.from({ length: size }, (_, k): CodeLine => {
    const target = targets[k] as string;
    if (template === 0)
      return { indent, tokens: [nm(target), ASSIGN, nm(target), op(operator), nm(shared)] };
    if (template === 1)
      return {
        indent,
        tokens: [
          nm(array),
          pu('['),
          num(k),
          pu(']'),
          ASSIGN,
          nm(shared),
          op(operator),
          num(amount),
        ],
      };
    return {
      indent,
      tokens: [
        fn(routine),
        pu('('),
        nm(array),
        pu('['),
        num(k),
        pu(']'),
        pu(','),
        nm(shared),
        pu(')'),
      ],
    };
  });
  return { lines, runOffsets: lines.map((_, k) => k) };
}

function structuredBlock(s: Scope, remaining: number): Block {
  const options: (() => CodeLine[])[] = [() => [statement(s, 0)]];
  if (remaining >= 3) {
    options.push(
      () => ifBlock(s, 0, Math.min(randomInt(s.random, 1, 2), remaining - 2)),
      () => forBlock(s, 0, remaining),
      () => whileBlock(s, 0, remaining),
    );
  }
  if (remaining >= 5) options.push(() => ifElseBlock(s, 0));
  return plain(pick(s.random, options)());
}

export interface GeneratedSnippet {
  readonly lines: Snippet;
  /** Indices of lines inside runs of near-identical lines (targets for subtle changes). */
  readonly runLines: readonly number[];
}

/** Exactly `elementCount` lines: an initialisation, blocks filling the middle, and a `return`. */
export function buildSnippet(random: RandomGenerator, profile: CodeScanProfile): GeneratedSnippet {
  const scope: Scope = {
    random,
    scalars: sample(random, SCALARS, 6),
    arrays: sample(random, ARRAYS, 2),
    complexity: profile.complexity,
  };
  const lines: CodeLine[] = [
    { indent: 0, tokens: [nm(scalar(scope)), ASSIGN, num(randomInt(random, 0, 9))] },
  ];
  const runLines: number[] = [];
  const middle = profile.elementCount - 2;
  while (lines.length - 1 < middle) {
    const remaining = middle - (lines.length - 1);
    const block =
      remaining >= 3 && chance(random, profile.visualNoise)
        ? runBlock(scope, 0, Math.min(randomInt(random, 3, 4), remaining))
        : structuredBlock(scope, remaining);
    runLines.push(...block.runOffsets.map((offset) => lines.length + offset));
    lines.push(...block.lines);
  }
  const result = chance(random, 0.5) ? [nm(scalar(scope))] : indexed(scope);
  lines.push({ indent: 0, tokens: [kw('return'), ...result] });
  return { lines, runLines };
}
