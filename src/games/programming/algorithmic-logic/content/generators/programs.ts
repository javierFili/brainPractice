import { numericResponse, singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import {
  ExecutionLimitError,
  execute,
  type Environment,
  type Mutation,
} from '../solvers/interpreter';
import type { ComparisonOp, Cond, Expr, LogicProfile, ProgramBlock, Stmt } from '../types';
import type { LogicDraft } from './draft';

const VARIABLES = ['a', 'b', 'c', 'd'];
const MAX_ABS_VALUE = 150;
const COMPARISONS: readonly ComparisonOp[] = ['<', '<=', '>', '>=', '=', '≠'];

const num = (value: number): Expr => ({ type: 'num', value });
const ref = (name: string): Expr => ({ type: 'var', name });
const add = (name: string, amount: Expr): Stmt => ({
  type: 'assign',
  target: name,
  expr: { type: 'bin', op: '+', left: ref(name), right: amount },
});
const sub = (name: string, amount: Expr): Stmt => ({
  type: 'assign',
  target: name,
  expr: { type: 'bin', op: '-', left: ref(name), right: amount },
});

interface BlockContext {
  readonly random: RandomGenerator;
  readonly vars: readonly string[];
  /** State right before the block, so conditions can be made close calls instead of obvious. */
  readonly env: Environment;
}

/** Comparison between two variables (or a variable and a constant) whose outcome is not obvious. */
function closeComparison({ random, vars, env }: BlockContext): Cond {
  const [x, y] = sample(random, vars, 2) as [string, string];
  const op = pick(random, COMPARISONS);
  const useConstant = randomInt(random, 0, 2) === 0;
  const right = useConstant ? num((env[x] ?? 0) + randomInt(random, -1, 1)) : ref(y);
  return { type: 'cmp', op, left: ref(x), right };
}

function booleanCondition(ctx: BlockContext): Cond {
  const left = closeComparison(ctx);
  const right = closeComparison(ctx);
  const combined: Cond = { type: pick(ctx.random, ['and', 'or'] as const), left, right };
  return randomInt(ctx.random, 0, 3) === 0 ? { type: 'not', operand: combined } : combined;
}

function simpleUpdate({ random, vars }: BlockContext, target: string): Stmt {
  const other = pick(
    random,
    vars.filter((v) => v !== target),
  );
  const amount = randomInt(random, 0, 1) === 0 ? num(randomInt(random, 1, 5)) : ref(other);
  return randomInt(random, 0, 2) === 0 ? sub(target, amount) : add(target, amount);
}

const BLOCKS: Record<ProgramBlock, (ctx: BlockContext) => Stmt[]> = {
  assign: (ctx) => {
    const [target, source] = sample(ctx.random, ctx.vars, 2) as [string, string];
    const op = pick(ctx.random, ['+', '-', '*'] as const);
    const right =
      op === '*'
        ? num(randomInt(ctx.random, 2, 3))
        : pick(ctx.random, [num(randomInt(ctx.random, 1, 6)), ref(target)]);
    return [{ type: 'assign', target, expr: { type: 'bin', op, left: ref(source), right } }];
  },
  swap: (ctx) => {
    const [a, b] = sample(ctx.random, ctx.vars, 2) as [string, string];
    return [{ type: 'swap', a, b }];
  },
  if: (ctx) => {
    const target = pick(ctx.random, ctx.vars);
    return [
      {
        type: 'if',
        cond: closeComparison(ctx),
        then: [simpleUpdate(ctx, target)],
        otherwise: [simpleUpdate(ctx, target)],
      },
    ];
  },
  'if-bool': (ctx) => {
    const target = pick(ctx.random, ctx.vars);
    return [
      {
        type: 'if',
        cond: booleanCondition(ctx),
        then: [simpleUpdate(ctx, target)],
        otherwise: [simpleUpdate(ctx, pick(ctx.random, ctx.vars))],
      },
    ];
  },
  repeat: (ctx) => {
    const target = pick(ctx.random, ctx.vars);
    return [
      { type: 'repeat', times: randomInt(ctx.random, 2, 4), body: [simpleUpdate(ctx, target)] },
    ];
  },
  'repeat-if': (ctx) => {
    const [x, y] = sample(ctx.random, ctx.vars, 2) as [string, string];
    const threshold = (ctx.env[x] ?? 0) + randomInt(ctx.random, 2, 6);
    return [
      {
        type: 'repeat',
        times: randomInt(ctx.random, 3, 5),
        body: [
          {
            type: 'if',
            cond: { type: 'cmp', op: '<', left: ref(x), right: num(threshold) },
            then: [add(x, num(randomInt(ctx.random, 1, 3)))],
            otherwise: [add(y, num(1))],
          },
        ],
      },
    ];
  },
  while: (ctx) => {
    const [counter, acc] = sample(ctx.random, ctx.vars, 2) as [string, string];
    const step = randomInt(ctx.random, 1, 3);
    const limit =
      (ctx.env[counter] ?? 0) +
      step * randomInt(ctx.random, 2, 4) +
      randomInt(ctx.random, 0, step - 1);
    return [
      {
        type: 'while',
        cond: { type: 'cmp', op: '<', left: ref(counter), right: num(limit) },
        body: [add(counter, num(step)), add(acc, ref(counter))],
      },
    ];
  },
  'nested-repeat': (ctx) => {
    const [x, y] = sample(ctx.random, ctx.vars, 2) as [string, string];
    return [
      {
        type: 'repeat',
        times: randomInt(ctx.random, 2, 3),
        body: [
          { type: 'repeat', times: randomInt(ctx.random, 2, 3), body: [add(x, num(1))] },
          sub(y, ref(x)),
        ],
      },
    ];
  },
};

/** Variables assigned or swapped anywhere in the statements. */
export function writtenVariables(statements: readonly Stmt[]): Set<string> {
  const written = new Set<string>();
  const walk = (list: readonly Stmt[]): void => {
    for (const stmt of list) {
      if (stmt.type === 'assign') written.add(stmt.target);
      else if (stmt.type === 'swap') [stmt.a, stmt.b].forEach((v) => written.add(v));
      else if (stmt.type === 'if') {
        walk(stmt.then);
        walk(stmt.otherwise);
      } else walk(stmt.body);
    }
  };
  walk(statements);
  return written;
}

function withinRange(env: Environment): boolean {
  return Object.values(env).every((value) => Math.abs(value) <= MAX_ABS_VALUE);
}

/** Values a careless trace would produce: branch taken the wrong way, loop off by one, last line missed. */
function mistakenValues(program: readonly Stmt[], ask: string, ifs: number): number[] {
  const mutations: Mutation[] = [
    ...Array.from({ length: ifs }, (_, i) => ({ flipIf: i })),
    { loopDelta: 1 },
    { loopDelta: -1 },
    { dropLast: true },
  ];
  return mutations.flatMap((mutation) => {
    try {
      const value = execute(program, mutation).env[ask];
      return value === undefined ? [] : [value];
    } catch {
      return [];
    }
  });
}

const formatState = (env: Environment) =>
  Object.entries(env)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name} = ${value}`)
    .join(', ');

export function programTrace(random: RandomGenerator, profile: LogicProfile): LogicDraft {
  const { variableCount, blockCount, blocks, answer } = profile.program;
  return retryGeneration('program trace', () => {
    const vars = VARIABLES.slice(0, variableCount);
    const program: Stmt[] = vars.map((name) => ({
      type: 'assign',
      target: name,
      expr: num(randomInt(random, 1, 9)),
    }));
    try {
      for (let i = 0; i < blockCount; i++) {
        // Use every allowed block kind before repeating one, so a level really exercises its constructs.
        const kind = i < blocks.length ? (blocks[i] as ProgramBlock) : pick(random, blocks);
        program.push(...BLOCKS[kind]({ random, vars, env: execute(program).env }));
      }
      const { env, ifsEvaluated } = execute(program);
      if (!withinRange(env)) return null;
      // Ask about a variable the logic actually changed, never one that only holds its initial value.
      const written = writtenVariables(program.slice(vars.length));
      const candidates = vars.filter((v) => written.has(v));
      if (candidates.length === 0) return null;
      const ask = pick(random, candidates);
      const value = env[ask] as number;
      // A value that ends where it started (e.g. after a double swap) makes the trace irrelevant.
      if (execute(program.slice(0, vars.length)).env[ask] === value) return null;
      // Every program with branches must have at least one condition that decides the answer.
      const flips = Array.from({ length: ifsEvaluated }, (_, flipIf) => flipIf);
      if (
        ifsEvaluated > 0 &&
        flips.every((flipIf) => execute(program, { flipIf }).env[ask] === value)
      )
        return null;
      const explanation = `Tracing the program line by line ends with ${formatState(env)}, so ${ask} = ${value}.`;
      const base = {
        content: { kind: 'program-trace' as const, program, ask },
        explanation,
        skills: ['working-memory', 'algorithmic-thinking'] as const,
      };

      if (answer === 'numeric') {
        return {
          ...base,
          prompt: `What is the value of ${ask} after the program runs?`,
          response: numericResponse(value),
        };
      }
      const mistakes = [...new Set(mistakenValues(program, ask, ifsEvaluated))].filter(
        (v) => v !== value,
      );
      // The answer's rank among the options is drawn first (uniform), then each side is filled
      // with plausible tracing mistakes on that side, topped up with nearby values. Otherwise
      // symmetric mistakes (loop ±1) would always leave the answer in the middle.
      const below = randomInt(random, 0, 3);
      const side = (sign: -1 | 1, count: number) => {
        const onSide = mistakes.filter((v) => Math.sign(v - value) === sign);
        const filler = [1, 2, 3, 4, 5, 6].map((d) => value + sign * d);
        return [...new Set([...shuffle(random, onSide), ...filler])].slice(0, count);
      };
      const distractors = [...side(-1, below), ...side(1, 3 - below)];
      return {
        ...base,
        prompt: `What is the value of ${ask} after the program runs?`,
        response: singleChoice(random, String(value), distractors.map(String)),
      };
    } catch (error) {
      if (error instanceof ExecutionLimitError) return null;
      throw error;
    }
  });
}
