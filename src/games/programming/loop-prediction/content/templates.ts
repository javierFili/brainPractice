import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import type { LoopKind, LoopStructure } from './types';

/**
 * A loop program plus what can be asked about it. Programs are only text here: every answer is
 * obtained by running them through the interpreter (see generate.ts).
 */
export interface LoopProgram {
  readonly structure: LoopStructure;
  readonly lines: readonly string[];
  /** 1-based line whose executions can be counted. */
  readonly countLine: number;
  /** Variables worth asking about at the end. */
  readonly vars: readonly string[];
  /** True when the program prints inside the loop. */
  readonly prints: boolean;
}

type Template = (random: RandomGenerator, max: number) => LoopProgram;

const r = randomInt;
const list = (random: RandomGenerator, length: number) =>
  Array.from({ length }, () => r(random, 1, 15));

const forSum: Template = (random, max) => {
  const from = r(random, 0, 3);
  const to = from + r(random, 2, max);
  const body = pick(random, [
    'total = total + i',
    `total = total + ${r(random, 2, 5)}`,
    'total = total + i * 2',
  ]);
  return {
    structure: 'simple',
    lines: [`total = ${r(random, 0, 5)}`, `for i in range(${from}, ${to}):`, `    ${body}`],
    countLine: 3,
    vars: ['total'],
    prints: false,
  };
};

const forPrint: Template = (random, max) => {
  const from = r(random, 0, 4);
  const to = from + r(random, 2, max);
  return {
    structure: 'simple',
    lines: [
      `for i in range(${from}, ${to}):`,
      `    print(i * ${r(random, 2, 4)} + ${r(random, 0, 5)})`,
    ],
    countLine: 2,
    vars: [],
    prints: true,
  };
};

const whileCount: Template = (random, max) => {
  const step = r(random, 2, 4);
  const limit = r(random, 0, 3);
  const start = limit + step * (r(random, 2, max) - 1) + r(random, 1, step);
  return {
    structure: 'simple',
    lines: [
      `n = ${start}`,
      'count = 0',
      `while n > ${limit}:`,
      `    n = n - ${step}`,
      '    count = count + 1',
    ],
    countLine: 4,
    vars: ['n', 'count'],
    prints: false,
  };
};

const whileDouble: Template = (random) => ({
  structure: 'simple',
  lines: [
    `x = ${r(random, 1, 3)}`,
    'steps = 0',
    `while x < ${r(random, 10, 70)}:`,
    `    x = x * ${pick(random, [2, 2, 3])}`,
    '    steps = steps + 1',
  ],
  countLine: 4,
  vars: ['x', 'steps'],
  prints: false,
});

const listIf: Template = (random, max) => {
  const items = list(random, r(random, Math.max(3, max - 2), max));
  const cond = pick(random, [
    'x % 2 == 0',
    `x > ${r(random, 4, 10)}`,
    `x % 3 == 0`,
    `x < ${r(random, 5, 11)}`,
  ]);
  const update = pick(random, ['total = total + x', 'total = total + 1', 'total = total + x - 1']);
  return {
    structure: 'conditional',
    lines: ['total = 0', `for x in [${items.join(', ')}]:`, `    if ${cond}:`, `        ${update}`],
    countLine: 4,
    vars: ['total'],
    prints: false,
  };
};

const printIf: Template = (random, max) => {
  const from = r(random, 1, 5);
  const to = from + r(random, Math.max(4, max - 1), max + 3);
  const k = r(random, 2, 4);
  return {
    structure: 'conditional',
    lines: [
      `for i in range(${from}, ${to}):`,
      `    if i % ${k} == ${r(random, 0, k - 1)}:`,
      `        print(i * ${r(random, 2, 3)})`,
    ],
    countLine: 3,
    vars: [],
    prints: true,
  };
};

const halving: Template = (random) => ({
  structure: 'conditional',
  lines: [
    `n = ${r(random, 6, 40)}`,
    'steps = 0',
    'while n > 1:',
    '    if n % 2 == 0:',
    '        n = n / 2',
    '    else:',
    '        n = n - 1',
    '    steps = steps + 1',
  ],
  countLine: 5,
  vars: ['steps'],
  prints: false,
});

const rectangle: Template = (random, max) => {
  const a = r(random, 2, Math.min(5, max));
  const b = r(random, 2, Math.min(5, max));
  const body = pick(random, [
    'count = count + 1',
    'count = count + i',
    'count = count + j',
    'count = count + i * j',
  ]);
  return {
    structure: 'nested',
    lines: ['count = 0', `for i in range(${a}):`, `    for j in range(${b}):`, `        ${body}`],
    countLine: 4,
    vars: ['count'],
    prints: false,
  };
};

const triangle: Template = (random, max) => {
  const a = r(random, 3, Math.min(6, max));
  const inner = pick(random, ['range(i)', 'range(i, ' + String(a) + ')', 'range(1, i)']);
  const body = pick(random, ['count = count + 1', 'count = count + j']);
  return {
    structure: 'nested',
    lines: [
      'count = 0',
      `for i in range(1, ${a + 1}):`,
      `    for j in ${inner}:`,
      `        ${body}`,
    ],
    countLine: 4,
    vars: ['count'],
    prints: false,
  };
};

const nestedPrint: Template = (random, max) => {
  const a = r(random, 2, Math.min(4, max));
  const b = r(random, 2, Math.min(4, max));
  return {
    structure: 'nested',
    lines: [
      `for i in range(1, ${a + 1}):`,
      `    for j in range(1, ${b + 1}):`,
      `        if ${pick(random, ['i != j', '(i + j) % 2 == 0', 'j > i', '(i * j) % 3 != 0'])}:`,
      `            print(i * ${r(random, 2, 4)} + j)`,
    ],
    countLine: 4,
    vars: [],
    prints: true,
  };
};

const firstOver: Template = (random, max) => {
  const items = list(random, r(random, Math.max(4, max - 2), max));
  const limit = r(random, 6, 12);
  const printing = chance(random, 0.4);
  return {
    structure: 'early-exit',
    lines: [
      'function first_over(items, limit):',
      '    for x in items:',
      ...(printing ? ['        print(x)'] : []),
      '        if x > limit:',
      '            return x',
      '    return -1',
      '',
      `result = first_over([${items.join(', ')}], ${limit})`,
    ],
    countLine: printing ? 4 : 3,
    vars: ['result'],
    prints: printing,
  };
};

const budget: Template = (random, max) => {
  const items = sample(
    random,
    Array.from({ length: 12 }, (_, i) => i + 2),
    r(random, Math.max(3, max - 2), max),
  );
  const limit = r(random, 10, 40);
  const printing = chance(random, 0.4);
  return {
    structure: 'early-exit',
    lines: [
      `items = [${items.join(', ')}]`,
      'i = 0',
      'total = 0',
      `while i < len(items) and total < ${limit}:`,
      '    total = total + items[i]',
      ...(printing ? ['    print(total)'] : []),
      '    i = i + 1',
    ],
    countLine: 5,
    vars: ['i', 'total'],
    prints: printing,
  };
};

export const TEMPLATES: Readonly<Record<LoopStructure, readonly Template[]>> = {
  simple: [forSum, forPrint, whileCount, whileDouble],
  conditional: [listIf, printIf, halving],
  nested: [rectangle, triangle, nestedPrint],
  'early-exit': [firstOver, budget],
};

/** Whether a program can carry a question of this kind. */
export const supports = (program: LoopProgram, kind: LoopKind) =>
  kind === 'iterations' ? true : kind === 'last-output' ? program.prints : program.vars.length > 0;
