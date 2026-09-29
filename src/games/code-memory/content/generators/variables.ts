import { numericResponse, singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { chance, pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { formatAssignment } from '../format';
import { trace, valueAt, type Slip } from '../solvers/state';
import type { Assignment, CodeMemoryProfile, Expr, Operand } from '../types';
import { VARIABLES } from '../vocabulary';
import type { MemoryDraft } from './draft';

const MAX_ABS_VALUE = 99;
/** From this length on, the answer must depend on a variable that was overwritten before the read. */
const STALE_CHECK_FROM_LINES = 5;

const num = (value: number): Operand => ({ type: 'num', value });
const ref = (name: string): Operand => ({ type: 'var', name });

function expression(
  random: RandomGenerator,
  assigned: readonly string[],
  ops: CodeMemoryProfile['state']['ops'],
  literalAllowed: boolean,
): Expr {
  if (assigned.length === 0 || (literalAllowed && chance(random, 0.4)))
    return num(randomInt(random, 1, 9));
  const op = pick(random, ops);
  const leftName = pick(random, assigned);
  // `x - x` is always 0: subtract a different variable or a constant.
  const others = op === '-' ? assigned.filter((name) => name !== leftName) : assigned;
  // Multiplying two variables grows too fast to hold in mind; scale by a small constant instead.
  const right =
    op === '*'
      ? num(randomInt(random, 2, 3))
      : others.length === 0 || chance(random, 0.5)
        ? num(randomInt(random, 1, 9))
        : ref(pick(random, others));
  const left = ref(leftName);
  return { type: 'bin', op, left, right };
}

/** Straight-line assignments; every variable is initialised before it is read. */
function buildLines(
  random: RandomGenerator,
  vars: readonly string[],
  { lineCount, ops }: CodeMemoryProfile['state'],
): Assignment[] {
  const assigned: string[] = [];
  const lines: Assignment[] = [];
  for (let i = 0; i < lineCount; i++) {
    const fresh = vars.filter((v) => !assigned.includes(v));
    const mustIntroduce = assigned.length === 0 || fresh.length >= lineCount - i;
    const introduce = fresh.length > 0 && (mustIntroduce || chance(random, 0.3));
    const target = introduce ? pick(random, fresh) : pick(random, assigned);
    lines.push({ target, expr: expression(random, assigned, ops, introduce) });
    if (introduce) assigned.push(target);
  }
  return lines;
}

const timesAssigned = (lines: readonly Assignment[], variable: string, upTo: number) =>
  lines.slice(0, upTo).filter((line) => line.target === variable).length;

const lastAssignment = (lines: readonly Assignment[], variable: string, upTo: number) =>
  lines
    .slice(0, upTo)
    .filter((line) => line.target === variable)
    .at(-1);

interface Ask {
  readonly variable: string;
  readonly afterLine: number | null;
}

/** Whether the question forces holding and updating state instead of recalling a single line. */
function isGoodAsk(lines: readonly Assignment[], ask: Ask): boolean {
  const upTo = ask.afterLine ?? lines.length;
  const answer = valueAt(lines, ask.variable, ask.afterLine);
  const first = valueAt(lines, ask.variable, lines.findIndex((l) => l.target === ask.variable) + 1);
  if (answer === undefined || answer === first) return false;
  if (timesAssigned(lines, ask.variable, upTo) < 2) return false;
  if (lastAssignment(lines, ask.variable, upTo)?.expr.type !== 'bin') return false;
  if (ask.afterLine !== null && valueAt(lines, ask.variable, null) === answer) return false;
  if (lines.length >= STALE_CHECK_FROM_LINES) {
    return valueAt(lines, ask.variable, ask.afterLine, { type: 'stale' }) !== answer;
  }
  return true;
}

/** Values produced by forgetting an update, reading stale values, or answering the wrong variable. */
function slipValues(lines: readonly Assignment[], ask: Ask, vars: readonly string[]): number[] {
  const slips: Slip[] = [
    { type: 'stale' },
    // Only updates can be forgotten; skipping an initialisation would leave a variable undefined.
    ...lines.flatMap((line, i): Slip[] =>
      timesAssigned(lines, line.target, i) > 0 ? [{ type: 'skip', line: i }] : [],
    ),
  ];
  const upTo = ask.afterLine ?? lines.length;
  const history = trace(lines)
    .slice(0, upTo)
    .map((env) => env[ask.variable]);
  const others = vars.map((v) => valueAt(lines, v, ask.afterLine));
  const later = ask.afterLine === null ? [] : [valueAt(lines, ask.variable, null)];
  return [
    ...later,
    ...slips.map((slip) => valueAt(lines, ask.variable, ask.afterLine, slip)),
    ...history,
    ...others,
  ].filter((value): value is number => value !== undefined);
}

function explain(lines: readonly Assignment[], ask: Ask, answer: number): string {
  const steps = trace(lines)
    .map((env, i) => {
      const line = lines[i] as Assignment;
      return `${i + 1}. ${formatAssignment(line)} → ${line.target} = ${env[line.target] ?? '?'}`;
    })
    .join('; ');
  const conclusion =
    ask.afterLine === null
      ? `so ${ask.variable} ended as ${answer}`
      : `so right after line ${ask.afterLine}, ${ask.variable} was ${answer} (it later became ${valueAt(lines, ask.variable, null) ?? '?'})`;
  return `${steps}; ${conclusion}.`;
}

/** Assignments shown, then hidden: compute and hold the evolving state of each variable. */
export function variableState(random: RandomGenerator, profile: CodeMemoryProfile): MemoryDraft {
  const { state, distractors: distractorCount } = profile;
  return retryGeneration('variable-state', () => {
    const vars = sample(random, VARIABLES, state.variableCount);
    const lines = buildLines(random, vars, state);
    const values = trace(lines).flatMap((env) => Object.values(env));
    if (values.some((value) => Math.abs(value) > MAX_ABS_VALUE)) return null;

    const intermediate = state.question === 'mixed' && chance(random, 0.5);
    const afterLine = intermediate
      ? randomInt(random, state.variableCount + 1, lines.length - 1)
      : null;
    const candidates = shuffle(random, vars)
      .map((variable): Ask => ({ variable, afterLine }))
      .filter((ask) => isGoodAsk(lines, ask));
    const ask = candidates[0];
    if (ask === undefined) return null;
    const answer = valueAt(lines, ask.variable, ask.afterLine) as number;

    const prompt =
      ask.afterLine === null
        ? `What was the final value of ${ask.variable}?`
        : `What was the value of ${ask.variable} right after line ${ask.afterLine}?`;
    const base = {
      prompt,
      content: { kind: 'variable-state', lines, ask } as const,
      explanation: explain(lines, ask, answer),
      skills: ['working-memory', 'debugging', 'algorithmic-thinking'] as const,
    };
    if (state.answer === 'numeric') return { ...base, response: numericResponse(answer) };

    const slips = [...new Set(slipValues(lines, ask, vars))].filter((v) => v !== answer);
    const near = [1, -1, 2, -2, 10, -10].map((d) => answer + d);
    const wrong = [...new Set([...shuffle(random, slips), ...shuffle(random, near)])]
      .filter((v) => v !== answer)
      .slice(0, distractorCount);
    return {
      ...base,
      response: singleChoice(random, String(answer), wrong.map(String)),
    };
  });
}
