import { numericResponse, singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, randomInt, sample, weightedPick, type RandomGenerator } from '@/domain/random';
import type { RunResult } from '@/domain/pseudocode';
import { distinctInts } from '@/games/kit/content';
import {
  compile,
  isInteger,
  narrate,
  numberChoice,
  runTraced,
  traceChanges,
  type DraftOf,
} from '../../shared/content';
import type { TrackingChallenge, TrackingKind, TrackingOp, TrackingProfile } from './types';

export const TRACKING_NAMES = ['a', 'b', 'c', 'd', 'e'] as const;
const MIN_VALUE = -40;
const MAX_VALUE = 99;

type Draft = DraftOf<TrackingChallenge>;

interface Block {
  readonly op: TrackingOp;
  readonly lines: readonly string[];
}

const k = (random: RandomGenerator, min = 1, max = 9) => randomInt(random, min, max);

/** One update block. Every block reads at least one variable (except `set`). */
function block(random: RandomGenerator, op: TrackingOp, vars: readonly string[]): Block {
  const [v, w, u] = sample(random, vars, Math.min(3, vars.length)) as [string, string, string?];
  const third = u ?? v;
  switch (op) {
    case 'set':
      return { op, lines: [`${v} = ${k(random)}`] };
    case 'add':
      return {
        op,
        lines: [`${v} = ${v} ${pick(random, ['+', '-'])} ${k(random)}`],
      };
    case 'copy':
      // The classic trap: w keeps the copied value while v moves on.
      return {
        op,
        lines: [
          `${w} = ${v}`,
          pick(random, [
            `${v} = ${v} + ${k(random, 2)}`,
            `${v} = ${v} * 2`,
            `${v} = ${v} - ${k(random, 2)}`,
          ]),
        ],
      };
    case 'combine':
      return {
        op,
        lines: [
          pick(random, [
            `${v} = ${w} + ${third}`,
            `${v} = ${w} - ${third}`,
            `${v} = ${v} + ${w}`,
            `${v} = ${w} - ${v}`,
            `${v} = ${w} * 2`,
          ]),
        ],
      };
    case 'swap':
      return { op, lines: [`temp = ${v}`, `${v} = ${w}`, `${w} = temp`] };
    case 'nested':
      return {
        op,
        lines: [
          pick(random, [
            `${v} = (${w} + ${k(random, 1, 4)}) * 2 - ${third}`,
            `${v} = ${v} * 2 + ${w} - ${k(random, 1, 5)}`,
            `${v} = ${w} - (${third} - ${v})`,
            `${v} = (${v} + ${w}) - (${third} + ${k(random, 1, 3)})`,
          ]),
        ],
      };
  }
}

export interface TrackingProgram {
  readonly source: string;
  readonly vars: readonly string[];
  readonly initCount: number;
  readonly blocks: readonly Block[];
  readonly result: RunResult;
}

/**
 * Builds and runs a candidate. Rejected when a value leaves the readable range, or a line changes
 * nothing (a swap of equal values, a copy onto an equal value): every line must matter.
 */
export function trackingProgram(
  random: RandomGenerator,
  profile: TrackingProfile,
): TrackingProgram | null {
  const vars = TRACKING_NAMES.slice(0, profile.variableCount);
  const initial = distinctInts(random, vars.length, 1, 12);
  const init = vars.map((v, i) => `${v} = ${initial[i]}`);
  // Each allowed construct appears at least once when there is room for it.
  const ops = sample(random, profile.ops, Math.min(profile.ops.length, profile.statementCount));
  while (ops.length < profile.statementCount) ops.push(pick(random, profile.ops));
  const blocks = sample(random, ops, ops.length).map((op) => block(random, op, vars));
  const source = [...init, ...blocks.flatMap((b) => b.lines)].join('\n');
  const program = compile(source);
  if (program === null) return null;
  const result = runTraced(program);
  if (result.error !== null) return null;
  const steps = traceChanges(source, result);
  if (steps.length !== source.split('\n').length) return null;
  if (steps.some((step) => step.changes.length === 0)) return null;
  for (const step of result.trace)
    for (const value of Object.values(step.variables))
      if (!isInteger(value) || value < MIN_VALUE || value > MAX_VALUE) return null;
  return { source, vars, initCount: init.length, blocks, result };
}

const valueAt = (p: TrackingProgram, line: number, name: string) =>
  p.result.trace[line - 1]?.variables[name];

/** Last line that assigns `name` (1-based). */
const lastAssignment = (p: TrackingProgram, name: string) => {
  const lines = p.source.split('\n');
  for (let i = lines.length - 1; i >= 0; i--)
    if (new RegExp(`^${name} = `).test(lines[i] as string)) return i + 1;
  return 0;
};

function valueResponse(random: RandomGenerator, profile: TrackingProfile, value: number) {
  return profile.answer === 'numeric' ? numericResponse(value) : numberChoice(random, value);
}

function finalValue(
  random: RandomGenerator,
  profile: TrackingProfile,
  p: TrackingProgram,
): Draft | null {
  const lines = p.source.split('\n');
  const eligible = p.vars.filter((name) => {
    const last = lastAssignment(p, name);
    // A constant as last write (`a = 5`) would make the rest of the program irrelevant.
    if (last <= p.initCount || /^\w+ = \d+$/.test(lines[last - 1] as string)) return false;
    return p.result.variables[name] !== valueAt(p, p.initCount, name);
  });
  if (eligible.length === 0) return null;
  const ask = pick(random, eligible);
  const value = p.result.variables[ask] as number;
  return {
    prompt: `What is the value of ${ask} when the program ends?`,
    content: { kind: 'final-value', source: p.source, variables: p.vars, ask, line: null },
    response: valueResponse(random, profile, value),
    explanation: `Step by step — ${narrate(p.source, p.result, 24)}. So ${ask} ends at ${value}.`,
    skills: ['working-memory', 'algorithmic-thinking'],
  };
}

function afterLine(
  random: RandomGenerator,
  profile: TrackingProfile,
  p: TrackingProgram,
): Draft | null {
  const lines = p.source.split('\n');
  const candidates = lines.flatMap((text, i) => {
    const line = i + 1;
    const name = /^(\w+) = /.exec(text)?.[1];
    if (line <= p.initCount + 1 || line >= lines.length || !name || !p.vars.includes(name))
      return [];
    const value = valueAt(p, line, name);
    // The intermediate value must differ from the final and the starting one.
    if (value === p.result.variables[name] || value === valueAt(p, p.initCount, name)) return [];
    return [{ line, name, value: value as number }];
  });
  if (candidates.length === 0) return null;
  const { line, name, value } = pick(random, candidates);
  const shortRun = { ...p.result, trace: p.result.trace.slice(0, line) };
  return {
    prompt: `What is the value of ${name} right after line ${line} runs?`,
    content: { kind: 'after-line', source: p.source, variables: p.vars, ask: name, line },
    response: valueResponse(random, profile, value),
    explanation: `Up to line ${line} — ${narrate(p.source, shortRun, 24)}. So ${name} is ${value} at that point (it ends at ${String(p.result.variables[name])}).`,
    skills: ['working-memory', 'sequential-thinking'],
  };
}

function largest(random: RandomGenerator, p: TrackingProgram): Draft | null {
  const values = p.vars.map((name) => p.result.variables[name] as number);
  const top = Math.max(...values);
  if (values.filter((v) => v === top).length !== 1) return null;
  const winner = p.vars[values.indexOf(top)] as string;
  const final = p.vars.map((name, i) => `${name} = ${values[i]}`).join(', ');
  return {
    prompt: `Which of ${p.vars.join(', ')} holds the largest value when the program ends?`,
    content: { kind: 'largest', source: p.source, variables: p.vars, ask: null, line: null },
    response: singleChoice(
      random,
      winner,
      p.vars.filter((v) => v !== winner),
    ),
    explanation: `Step by step — ${narrate(p.source, p.result, 24)}. At the end ${final}, so ${winner} is the largest.`,
    skills: ['working-memory', 'logical-reasoning'],
  };
}

export function generateTracking(random: RandomGenerator, profile: TrackingProfile): Draft {
  const kind: TrackingKind = weightedPick(random, profile.kinds);
  return retryGeneration(`variable-tracking ${kind}`, () => {
    const program = trackingProgram(random, profile);
    if (program === null) return null;
    switch (kind) {
      case 'final-value':
        return finalValue(random, profile, program);
      case 'after-line':
        return afterLine(random, profile, program);
      case 'largest':
        return largest(random, program);
    }
  });
}
