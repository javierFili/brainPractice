import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import type { CodeScanSprintProfile, ScanLine } from './types';

/** Short, plain names: no near-duplicates, no digits. */
export const VARIABLES = ['total', 'score', 'count', 'price', 'level', 'speed'] as const;
export const ROUTINES = ['print', 'show', 'save', 'send', 'log'] as const;

/** A line plus what it does, so queries are answered by code rather than by reading text. */
export interface FactLine extends ScanLine {
  readonly assigns: string | null;
  readonly calls: string | null;
  /** Variables named in an `if` / `while` condition (empty otherwise). */
  readonly checks: readonly string[];
  /** Every variable named on the line. */
  readonly names: readonly string[];
  readonly numbers: readonly number[];
}

const line = (
  indent: number,
  text: string,
  facts: Partial<Omit<FactLine, 'indent' | 'text'>>,
): FactLine => ({
  indent,
  text,
  assigns: facts.assigns ?? null,
  calls: facts.calls ?? null,
  checks: facts.checks ?? [],
  names: facts.names ?? [],
  numbers: [...new Set(facts.numbers ?? [])],
});

interface Scope {
  readonly random: RandomGenerator;
  readonly variables: readonly string[];
  readonly routines: readonly string[];
  readonly maxNumber: number;
}

const num = (s: Scope) => randomInt(s.random, 1, s.maxNumber);
const variable = (s: Scope) => pick(s.random, s.variables);

function statement(s: Scope, indent: number): FactLine {
  const roll = randomInt(s.random, 0, 3);
  if (roll === 0) {
    const x = variable(s);
    const n = num(s);
    return line(indent, `${x} ← ${n}`, { assigns: x, names: [x], numbers: [n] });
  }
  if (roll === 1) {
    const x = variable(s);
    const y = chance(s.random, 0.5) ? x : variable(s);
    const n = num(s);
    const op = pick(s.random, ['+', '-', '*'] as const);
    return line(indent, `${x} ← ${y} ${op} ${n}`, {
      assigns: x,
      names: [x, y],
      numbers: [n],
    });
  }
  const f = pick(s.random, s.routines);
  if (roll === 2) {
    const x = variable(s);
    return line(indent, `${f}(${x})`, { calls: f, names: [x] });
  }
  const n = num(s);
  return line(indent, `${f}(${n})`, { calls: f, numbers: [n] });
}

function header(s: Scope, indent: number): FactLine {
  const roll = randomInt(s.random, 0, 2);
  const n = num(s);
  if (roll === 0) return line(indent, `repeat ${n} times:`, { numbers: [n] });
  const x = variable(s);
  const keyword = roll === 1 ? 'if' : 'while';
  const op = pick(s.random, keyword === 'if' ? (['>', '<', '='] as const) : (['<', '>'] as const));
  return line(indent, `${keyword} ${x} ${op} ${n}:`, { checks: [x], names: [x], numbers: [n] });
}

/**
 * A listing of exactly `lineCount` lines. Every block header is followed by at least one line
 * inside it; blocks nest up to `maxDepth`.
 */
export function buildSnippet(random: RandomGenerator, profile: CodeScanSprintProfile): FactLine[] {
  const s: Scope = {
    random,
    variables: sample(random, VARIABLES, profile.variables),
    routines: sample(random, ROUTINES, profile.routines),
    maxNumber: profile.maxNumber,
  };
  const lines: FactLine[] = [];
  /** Lines still owed to each open block, innermost last. */
  const open: number[] = [];
  while (lines.length < profile.lineCount) {
    while (open.length > 0 && open.at(-1) === 0) open.pop();
    const depth = open.length;
    const room = profile.lineCount - lines.length;
    if (open.length > 0) open[open.length - 1] = (open.at(-1) as number) - 1;
    if (depth < profile.maxDepth && room >= 2 && chance(random, 0.35)) {
      lines.push(header(s, depth));
      open.push(randomInt(random, 1, Math.min(3, room - 1)));
    } else {
      lines.push(statement(s, depth));
    }
  }
  return lines;
}
