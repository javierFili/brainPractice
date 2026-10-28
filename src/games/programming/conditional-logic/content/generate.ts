import { singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { runProgram, type Program, type Variables } from '@/domain/pseudocode';
import {
  chance,
  pick,
  randomInt,
  shuffle,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import { compile, describeVariables, indent, runQuick, type DraftOf } from '../../shared/content';
import type {
  ConditionalChallenge,
  ConditionalKind,
  ConditionalProfile,
  ConditionPart,
} from './types';

type Draft = DraftOf<ConditionalChallenge>;

export const ERROR_OUTCOME = 'Stops with an error (division by zero)';
const LABELS = ['A', 'B', 'C', 'D', 'E'];
const COMPARISONS = ['<', '<=', '>', '>=', '==', '!='] as const;
const FLAG = 'ready';
const MAX = 9;

// ── Program tree ────────────────────────────────────────────────────────────────────────────────

type Node =
  | { readonly type: 'print'; readonly label: string }
  | {
      readonly type: 'if';
      readonly branches: readonly { readonly cond: string; readonly body: Node }[];
      readonly otherwise: Node;
    };

interface Rendered {
  readonly lines: string[];
  /** Line number (1-based, after `offset`) of each condition text, in reading order. */
  readonly condLines: Map<string, number>;
}

function render(node: Node, offset: number): Rendered {
  const lines: string[] = [];
  const condLines = new Map<string, number>();
  const walk = (n: Node, depth: number) => {
    const pad = ' '.repeat(depth * 4);
    if (n.type === 'print') {
      lines.push(`${pad}print("${n.label}")`);
      return;
    }
    n.branches.forEach((branch, i) => {
      lines.push(`${pad}${i === 0 ? 'if' : 'elif'} ${branch.cond}:`);
      condLines.set(branch.cond, offset + lines.length);
      walk(branch.body, depth + 1);
    });
    lines.push(`${pad}else:`);
    walk(n.otherwise, depth + 1);
  };
  walk(node, 0);
  return { lines, condLines };
}

const conditionsOf = (node: Node): string[] =>
  node.type === 'print'
    ? []
    : [
        ...node.branches.flatMap((b) => [b.cond, ...conditionsOf(b.body)]),
        ...conditionsOf(node.otherwise),
      ];

// ── Conditions ──────────────────────────────────────────────────────────────────────────────────

interface Ctx {
  readonly random: RandomGenerator;
  readonly names: readonly string[];
  readonly parts: readonly ConditionPart[];
}

/** A comparison or flag test about one subject (`x`, `y` or the flag). */
function atom({ random, names }: Ctx, subject: string): string {
  if (subject === FLAG) return pick(random, [FLAG, `not ${FLAG}`]);
  const other = names.find((n) => n !== subject);
  if (other !== undefined && chance(random, 0.2))
    return `${subject} ${pick(random, ['<', '>', '==', '!='])} ${other}`;
  return `${subject} ${pick(random, COMPARISONS)} ${randomInt(random, 1, MAX - 1)}`;
}

/**
 * Compound conditions talk about different subjects (no `x > 3 or x > 5`), and `not` is only
 * applied to a whole parenthesised group, never stacked on a negated flag.
 */
function condition(ctx: Ctx): string {
  const { random, names, parts } = ctx;
  const subjects = parts.includes('flag') ? [...names, FLAG] : [...names];
  const forms = parts.filter((p) => p !== 'flag');
  const form = pick(random, forms);
  const needed = form === 'compare' ? 1 : form === 'mixed' ? 3 : 2;
  const order = shuffle(random, subjects);
  const chosen = Array.from({ length: needed }, (_, i) =>
    i < order.length ? (order[i] as string) : pick(random, names),
  );
  const [a, b, c] = chosen.map((subject) =>
    form === 'not' && subject === FLAG ? FLAG : atom(ctx, subject),
  ) as [string, string?, string?];
  switch (form) {
    case 'compare':
      return a;
    case 'and':
    case 'or':
      return `${a} ${form} ${b as string}`;
    case 'not':
      return `not (${a} ${pick(random, ['and', 'or'])} ${b as string})`;
    default:
      return chance(random, 0.5)
        ? `(${a} or ${b as string}) and ${c as string}`
        : `${a} and (${b as string} or ${c as string})`;
  }
}

/** A condition with a division by y, either guarded (safe order) or guard-last (unsafe). */
function riskyCondition(random: RandomGenerator): string {
  const risky = pick(random, [
    `x / y > ${randomInt(random, 1, 4)}`,
    `x % y == 0`,
    `x % y > ${randomInt(random, 1, 3)}`,
  ]);
  const safe = chance(random, 0.5);
  if (chance(random, 0.5)) {
    const guard = pick(random, ['y != 0', 'y > 0']);
    return safe ? `${guard} and ${risky}` : `${risky} and ${guard}`;
  }
  return safe ? `y == 0 or ${risky}` : `${risky} or y == 0`;
}

// ── Shapes ──────────────────────────────────────────────────────────────────────────────────────

function chain(conds: () => string, labels: readonly string[]): Node {
  const last = labels.at(-1) as string;
  return {
    type: 'if',
    branches: labels
      .slice(0, -1)
      .map((label) => ({ cond: conds(), body: { type: 'print', label } })),
    otherwise: { type: 'print', label: last },
  };
}

function nestedTree(ctx: Ctx, outcomes: number, first: (() => string) | null): Node {
  // Split the leaves over an outer if/else (at least one inner chain of two).
  const left = randomInt(ctx.random, outcomes >= 4 ? 2 : 1, outcomes - 2);
  const leftLabels = LABELS.slice(0, left);
  const rightLabels = LABELS.slice(left, outcomes);
  const side = (labels: readonly string[]): Node =>
    labels.length === 1
      ? { type: 'print', label: labels[0] as string }
      : chain(() => condition(ctx), labels);
  return {
    type: 'if',
    branches: [{ cond: first ? first() : condition(ctx), body: side(leftLabels) }],
    otherwise: side(rightLabels),
  };
}

// ── Evaluation (all through the interpreter) ────────────────────────────────────────────────────

export type Outcome = string;

interface Built {
  readonly tree: Node;
  readonly bodyLines: readonly string[];
  /** Condition programs (`result = <cond>`), compiled on first use. */
  readonly conds: Map<string, Program | null>;
  readonly names: readonly string[];
}

function outcomeOf(body: Program, inputs: Variables): Outcome {
  const result = runQuick(body, inputs);
  if (result.error !== null) return result.error.kind === 'value' ? ERROR_OUTCOME : 'invalid';
  return result.output.join(' ') || 'nothing';
}

interface Step {
  readonly cond: string;
  readonly value: boolean | 'error';
}

/** Walks the tree the way the interpreter does, condition by condition, for the explanation. */
function walk(built: Built, inputs: Variables): { steps: Step[]; outcome: Outcome } {
  const steps: Step[] = [];
  let node: Node = built.tree;
  while (node.type === 'if') {
    let next: Node = node.otherwise;
    for (const branch of node.branches) {
      if (!built.conds.has(branch.cond))
        built.conds.set(branch.cond, compile(`result = ${branch.cond}`));
      const program = built.conds.get(branch.cond);
      if (!program) throw new Error(`Condition does not parse: ${branch.cond}`);
      const result = runQuick(program, inputs);
      if (result.error !== null) {
        steps.push({ cond: branch.cond, value: 'error' });
        return { steps, outcome: ERROR_OUTCOME };
      }
      const value = result.variables['result'] === true;
      steps.push({ cond: branch.cond, value });
      if (value) {
        next = branch.body;
        break;
      }
    }
    node = next;
  }
  return { steps, outcome: node.label };
}

function grid(names: readonly string[], flag: boolean, minY: number): Variables[] {
  const values = Array.from({ length: MAX + 1 }, (_, i) => i);
  const points: Variables[] = [];
  for (const x of values)
    for (const y of names.length > 1 ? values.filter((v) => v >= minY) : [null])
      for (const f of flag ? [true, false] : [null]) {
        const point: Record<string, number | boolean> = { x };
        if (y !== null) point['y'] = y;
        if (f !== null) point[FLAG] = f;
        points.push(point);
      }
  return points;
}

/**
 * Outcome for every grid point. Runs with y ≥ 1 cannot fail, so they are batched into one
 * interpreter run (nested loops around the body, one print per point, in grid order); runs with
 * y = 0 (short-circuit levels) are run one by one because a division error stops a run.
 */
function gridOutcomes(
  bodyLines: readonly string[],
  names: readonly string[],
  flag: boolean,
  body: Program | null,
  points: readonly Variables[],
): Outcome[] | null {
  const loops = [`for x in range(0, ${MAX + 1}):`];
  if (names.length > 1) loops.push(`for y in range(1, ${MAX + 1}):`);
  if (flag) loops.push(`for ${FLAG} in [true, false]:`);
  const batch = compile(
    [...loops.map((l, i) => `${' '.repeat(4 * i)}${l}`), ...indent(bodyLines, loops.length)].join(
      '\n',
    ),
  );
  if (batch === null) return null;
  const run = runProgram(batch, { limits: { maxSteps: 50_000, maxTrace: 0 } });
  if (run.error !== null) return null;
  const batched = run.output;
  let next = 0;
  const outcomes: Outcome[] = [];
  for (const point of points) {
    if (point['y'] === 0) {
      if (body === null) return null;
      outcomes.push(outcomeOf(body, point));
    } else {
      const outcome = batched[next++];
      if (outcome === undefined) return null;
      outcomes.push(outcome);
    }
  }
  if (next !== batched.length || outcomes.includes('invalid')) return null;
  return outcomes;
}

function build(random: RandomGenerator, profile: ConditionalProfile, kind: ConditionalKind) {
  const names = profile.numberInputs === 2 ? ['x', 'y'] : ['x'];
  const ctx: Ctx = { random, names, parts: profile.parts };
  const labels = LABELS.slice(0, profile.outcomes);
  let tree: Node;
  if (kind === 'nested') tree = nestedTree(ctx, profile.outcomes, null);
  else if (kind === 'short-circuit') {
    // The risky condition comes first or second, so every run with y = 0 meets it.
    const riskyAt = randomInt(random, 0, 1);
    let i = 0;
    tree = chance(random, 0.5)
      ? chain(() => (i++ === riskyAt ? riskyCondition(random) : condition(ctx)), labels)
      : nestedTree(ctx, profile.outcomes, () => riskyCondition(random));
  } else tree = chain(() => condition(ctx), labels);

  const condTexts = conditionsOf(tree);
  if (new Set(condTexts).size !== condTexts.length) return null;
  const { lines: bodyLines } = render(tree, 0);
  // Only runs that may divide by zero (y = 0) need the body on its own.
  const body = kind === 'short-circuit' ? compile(bodyLines.join('\n')) : null;
  const built: Built = { tree, bodyLines, conds: new Map(), names };
  const flag = condTexts.some((c) => c.includes(FLAG));
  const points = grid(names, flag, kind === 'short-circuit' ? 0 : 1);
  // Every branch must be reachable by some input: no branch is shadowed or equivalent to another.
  const outcomes = gridOutcomes(bodyLines, names, flag, body, points);
  if (outcomes === null) return null;
  const reached = new Set(outcomes);
  if (!labels.every((label) => reached.has(label))) return null;
  // (Reachability also rules out constant conditions: an always-true or always-false test
  // would leave some branch that can never run.)
  return { built, points, outcomes, labels, flag };
}

const literalInputs = (inputs: Variables) =>
  Object.entries(inputs).map(([name, value]) => `${name} = ${String(value)}`);

function explain(built: Built, inputs: Variables, offset: number): string {
  const { steps, outcome } = walk(built, inputs);
  const condLines = render(built.tree, offset).condLines;
  const parts = steps.map(({ cond, value }) => {
    const line = condLines.get(cond) as number;
    return value === 'error'
      ? `line ${line}: “${cond}” evaluates the division first, with y = 0 → error`
      : `line ${line}: “${cond}” is ${String(value)}`;
  });
  const end =
    outcome === ERROR_OUTCOME
      ? 'so the program stops with an error. “and” / “or” only skip the right side when the left side already decides the result.'
      : `so it prints ${outcome}.`;
  return `With ${describeVariables(inputs)}: ${parts.join('; ')} — ${end}`;
}

// ── Kinds ──────────────────────────────────────────────────────────────────────────────────────

function forwardQuestion(
  random: RandomGenerator,
  profile: ConditionalProfile,
  kind: ConditionalKind,
): Draft | null {
  const candidate = build(random, profile, kind);
  if (candidate === null) return null;
  const { built, points, outcomes, labels } = candidate;
  // Short-circuit: most runs use y = 0, so the order inside the risky condition decides.
  const zero = chance(random, 0.65);
  const pool = points
    .map((p, i) => ({ p, outcome: outcomes[i] as string }))
    .filter(({ p }) => kind !== 'short-circuit' || (p['y'] === 0) === zero);
  const choices = [...new Set(pool.map((e) => e.outcome))];
  if (choices.length === 0) return null;
  const target = pick(random, choices);
  const inputs = pick(
    random,
    pool.filter((e) => e.outcome === target),
  ).p;
  const { outcome, steps } = walk(built, inputs);
  if (outcome !== target) return null;
  // With y = 0 the run must actually meet the division: that is the point of the question.
  if (kind === 'short-circuit' && zero && !steps.some((s) => /[/%]/.test(s.cond))) return null;
  const inputLines = literalInputs(inputs);
  const source = [...inputLines, ...built.bodyLines].join('\n');
  const optionLabels = kind === 'short-circuit' ? [...labels, ERROR_OUTCOME] : labels;
  const prompt =
    kind === 'short-circuit'
      ? 'What happens when this program runs?'
      : 'Which letter does this program print?';
  return {
    prompt,
    content: { kind, source, inputs, target: null },
    response: singleChoice(
      random,
      target,
      optionLabels.filter((l) => l !== target),
    ),
    explanation: explain(built, inputs, inputLines.length),
    skills:
      kind === 'short-circuit'
        ? ['logical-reasoning', 'debugging']
        : ['logical-reasoning', 'algorithmic-thinking'],
  };
}

function findInput(random: RandomGenerator, profile: ConditionalProfile): Draft | null {
  const shape = (profile.kinds.nested ?? 0) > 0 && chance(random, 0.5) ? 'nested' : 'branch';
  const candidate = build(random, profile, shape);
  if (candidate === null) return null;
  const { built, points, outcomes, labels } = candidate;
  const target = pick(random, labels);
  const hits = points.filter((_, i) => outcomes[i] === target);
  const misses = shuffle(
    random,
    points.filter((_, i) => outcomes[i] !== target),
  );
  if (hits.length === 0 || misses.length < 3) return null;
  const answer = pick(random, hits);
  const wrong = misses.slice(0, 3);
  const label = (p: Variables) => describeVariables(p);
  const source = built.bodyLines.join('\n');
  const missesExplained = wrong
    .map((p) => `${label(p)} prints ${walk(built, p).outcome}`)
    .join('; ');
  return {
    prompt: `Which input makes this program print ${target}?`,
    content: { kind: 'find-input', source, inputs: null, target },
    response: singleChoice(random, label(answer), wrong.map(label)),
    explanation: `${explain(built, answer, 0)} The others: ${missesExplained}.`,
    skills: ['logical-reasoning', 'problem-solving'],
  };
}

export function generateConditional(random: RandomGenerator, profile: ConditionalProfile): Draft {
  const kind = weightedPick(random, profile.kinds);
  return retryGeneration(`conditional-logic ${kind}`, () =>
    kind === 'find-input' ? findInput(random, profile) : forwardQuestion(random, profile, kind),
  );
}
