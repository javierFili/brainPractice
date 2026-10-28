import { pick, randomInt, type RandomGenerator } from '@/domain/random';
import type { OperationFamily } from './types';

export interface Expression {
  readonly text: string;
  readonly value: number;
  /** Wrong results a hurried solver might produce (e.g. ignoring precedence); may be empty. */
  readonly slips: readonly number[];
}

const PLUS = '+';
const MINUS = '−';
const TIMES = '×';
const DIVIDE = '÷';

const e = (text: string, value: number, slips: readonly number[] = []): Expression => ({
  text,
  value,
  slips,
});

function addSub(random: RandomGenerator, min: number, max: number, limit: number): Expression {
  const a = randomInt(random, min, max);
  const b = randomInt(random, min, max);
  if (random.next() < 0.5 && a + b <= limit)
    return e(`${a} ${PLUS} ${b}`, a + b, [Math.abs(a - b)]);
  const [big, small] = a >= b ? [a, b] : [b, a];
  return e(`${big} ${MINUS} ${small}`, big - small, [big + small]);
}

/** Builds one expression of the family; the value is always computed from the operands. */
export function buildExpression(random: RandomGenerator, family: OperationFamily): Expression {
  switch (family) {
    case 'add-small': {
      const a = randomInt(random, 1, 9);
      const b = randomInt(random, 1, 9);
      return e(`${a} ${PLUS} ${b}`, a + b);
    }
    case 'add-sub-20':
      return addSub(random, 2, 12, 20);
    case 'times-table': {
      const a = randomInt(random, 2, 9);
      const b = randomInt(random, 2, 9);
      return e(`${a} ${TIMES} ${b}`, a * b, [a + b]);
    }
    case 'division': {
      const divisor = randomInt(random, 2, 9);
      const quotient = randomInt(random, 2, 9);
      return e(`${divisor * quotient} ${DIVIDE} ${divisor}`, quotient);
    }
    case 'add-sub-2d':
      return addSub(random, 11, 89, 150);
    case 'times-2d': {
      const a = randomInt(random, 12, 49);
      const b = randomInt(random, 2, 9);
      return e(`${a} ${TIMES} ${b}`, a * b, [(a - (a % 10)) * b + (a % 10)]);
    }
    case 'precedence': {
      const a = randomInt(random, 2, 20);
      const b = randomInt(random, 2, 9);
      const c = randomInt(random, 2, 9);
      // Left-to-right reading is the classic slip: 3 + 4 × 2 read as (3 + 4) × 2.
      if (random.next() < 0.5)
        return e(`${a} ${PLUS} ${b} ${TIMES} ${c}`, a + b * c, [(a + b) * c]);
      const product = b * c;
      const minuend = randomInt(random, product, product + 20);
      return e(`${minuend} ${MINUS} ${b} ${TIMES} ${c}`, minuend - product, [(minuend - b) * c]);
    }
    case 'brackets': {
      const c = randomInt(random, 2, 9);
      const form = pick(random, ['sum', 'difference'] as const);
      if (form === 'sum') {
        const a = randomInt(random, 2, 9);
        const b = randomInt(random, 2, 9);
        return e(`(${a} ${PLUS} ${b}) ${TIMES} ${c}`, (a + b) * c, [a + b * c]);
      }
      const b = randomInt(random, 2, 9);
      const a = randomInt(random, b + 1, b + 9);
      return e(`(${a} ${MINUS} ${b}) ${TIMES} ${c}`, (a - b) * c, [a - b * c]);
    }
  }
}

/**
 * Independent evaluator for the expressions above (used by tests as an oracle): integers, the
 * four operators and one level of brackets, with × and ÷ binding tighter than + and −.
 */
export function evaluateExpression(text: string): number {
  const tokens = text.replaceAll('(', ' ( ').replaceAll(')', ' ) ').trim().split(/\s+/);
  let position = 0;
  const peek = () => tokens[position];
  const next = () => tokens[position++] as string;
  const atom = (): number => {
    const token = next();
    if (token === '(') {
      const inner = sum();
      next();
      return inner;
    }
    return Number(token);
  };
  const product = (): number => {
    let value = atom();
    while (peek() === TIMES || peek() === DIVIDE) {
      const operator = next();
      const right = atom();
      value = operator === TIMES ? value * right : value / right;
    }
    return value;
  };
  const sum = (): number => {
    let value = product();
    while (peek() === PLUS || peek() === MINUS) {
      const operator = next();
      const right = product();
      value = operator === PLUS ? value + right : value - right;
    }
    return value;
  };
  return sum();
}

/** "3 + 4 × 2" → "3 plus 4 times 2", for screen readers. */
export const spokenExpression = (text: string) =>
  text
    .replaceAll(PLUS, 'plus')
    .replaceAll(MINUS, 'minus')
    .replaceAll(TIMES, 'times')
    .replaceAll(DIVIDE, 'divided by')
    .replaceAll('(', 'open bracket ')
    .replaceAll(')', ' close bracket');
