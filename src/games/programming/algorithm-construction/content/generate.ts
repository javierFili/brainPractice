import type { ResponseOf } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import {
  chance,
  pick,
  randomInt,
  sample,
  shuffle,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import { msg, type Text } from '@/domain/shared';
import { compile, isInteger, narrateText, runTraced, type DraftOf } from '../../shared/content';
import {
  arrangements,
  BLOCK_STEP_LIMIT,
  certainReads,
  runChain,
  solutions,
  type CompiledBlock,
} from './search';
import type { ConstructionChallenge, ConstructionKind, ConstructionProfile } from './types';

type Draft = DraftOf<ConstructionChallenge>;

const NAMES = ['x', 'y', 'z'];
const LETTERS = 'ABCDEFG';
const MAX_VALUE = 500;

const k = (random: RandomGenerator, min = 1, max = 6) => randomInt(random, min, max);

interface State {
  readonly random: RandomGenerator;
  readonly vars: readonly string[];
  readonly assigned: Set<string>;
  previous: string;
}

/** A straight-line update that reads the previous block's variable (so blocks depend on each other). */
function straight(s: State): string {
  const { random } = s;
  const p = s.previous;
  const unassigned = s.vars.filter((v) => !s.assigned.has(v));
  const t =
    unassigned.length > 0 && chance(random, 0.7) ? pick(random, unassigned) : pick(random, s.vars);
  const others = [...s.assigned].filter((v) => v !== p);
  const forms = [
    `${t} = ${p} + ${k(random)}`,
    `${t} = ${p} * ${k(random, 2, 3)}`,
    `${t} = ${p} - ${k(random)}`,
  ];
  if (others.length > 0) {
    const o = pick(random, others);
    forms.push(`${t} = ${p} + ${o}`, `${t} = ${p} - ${o}`);
  }
  if (s.assigned.has(t) && t !== p) forms.push(`${t} = ${t} + ${p}`, `${t} = ${t} * ${p}`);
  s.assigned.add(t);
  s.previous = t;
  return pick(random, forms);
}

/** A loop block updating an already-set variable. */
function loop(s: State): string {
  const { random } = s;
  const v = s.previous;
  const others = [...s.assigned].filter((x) => x !== v);
  const forms = [
    `for i in range(1, ${k(random, 3, 5)}):\n    ${v} = ${v} + i`,
    `for i in range(${k(random, 2, 3)}):\n    ${v} = ${v} * 2`,
    `for i in range(${k(random, 2, 4)}):\n    ${v} = ${v} + ${k(random, 2, 5)}`,
    `while ${v} < ${k(random, 15, 40)}:\n    ${v} = ${v} * 2`,
  ];
  if (others.length > 0)
    forms.push(`for i in range(${k(random, 2, 3)}):\n    ${v} = ${v} + ${pick(random, others)}`);
  return pick(random, forms);
}

function finalPrint(s: State): string {
  const { random } = s;
  const assigned = [...s.assigned];
  const forms = [`print(${s.previous})`];
  if (assigned.length > 1) {
    const other = pick(
      random,
      assigned.filter((v) => v !== s.previous),
    );
    forms.push(`print(${s.previous} + ${other})`, `print(${other}, ${s.previous})`);
  }
  return pick(random, forms);
}

/** The intended program, block by block (first block initialises, last one prints). */
function intended(random: RandomGenerator, profile: ConstructionProfile): string[] {
  const vars = NAMES.slice(0, profile.variableCount);
  const first = pick(random, vars);
  const s: State = { random, vars, assigned: new Set([first]), previous: first };
  const middle = profile.blockCount - 2;
  const loopSlots = new Set(
    sample(
      random,
      Array.from({ length: middle }, (_, i) => i),
      Math.min(profile.loops, middle),
    ),
  );
  const blocks = [`${first} = ${k(random, 1, 9)}`];
  for (let i = 0; i < middle; i++) blocks.push(loopSlots.has(i) ? loop(s) : straight(s));
  blocks.push(finalPrint(s));
  return blocks;
}

/** A plausible block that the finished program does not need. */
function spare(
  random: RandomGenerator,
  profile: ConstructionProfile,
  used: readonly string[],
): string {
  const vars = NAMES.slice(0, profile.variableCount);
  const assigned = vars.filter((v) =>
    used.some((b) => b.startsWith(`${v} = `) || b.includes(`    ${v} = `)),
  );
  const s: State = { random, vars, assigned: new Set(assigned), previous: pick(random, assigned) };
  return pick(random, [straight, loop, finalPrint, straight] as const)(s);
}

/** "A · for i in range(3): x = x * 2" — the block on one line for the ordering list. */
const itemLabel = (letter: string, code: string) => {
  const [head, ...body] = code.split('\n');
  return `${letter} · ${[head, body.map((l) => l.trim()).join('; ')].filter((x) => x !== '').join(' ')}`;
};

function candidate(
  random: RandomGenerator,
  profile: ConstructionProfile,
  kind: ConstructionKind,
): Draft | null {
  const used = intended(random, profile);
  const all = kind === 'spare-block' ? [...used, spare(random, profile, used)] : [...used];
  if (new Set(all).size !== all.length) return null;

  // Show the blocks shuffled; ids follow the shown order so letters read A, B, C… on screen.
  const shownCode = shuffle(random, all);
  const ids = shownCode.map((_, i) => LETTERS.charAt(i));
  const compiled: CompiledBlock[] = [];
  for (const [i, code] of shownCode.entries()) {
    const parsed = compile(code);
    if (parsed === null) return null;
    compiled.push({ id: ids[i] as string, body: parsed.body, reads: certainReads(parsed.body) });
  }
  // The target is what the intended order prints (cheap chained run, same as the search).
  const intendedRun = runChain(
    used.map((code) => compiled[shownCode.indexOf(code)] as CompiledBlock),
  );
  if (intendedRun === null || intendedRun.output.length === 0) return null;
  if (intendedRun.steps > BLOCK_STEP_LIMIT / 2) return null;
  const target = intendedRun.output;
  if (
    target.some((line) =>
      line.split(' ').some((v) => !isInteger(Number(v)) || Math.abs(Number(v)) > MAX_VALUE),
    )
  )
    return null;
  const idOf = (code: string) => ids[shownCode.indexOf(code)] as string;
  const found = solutions(compiled, target, used.length);
  if (found.length !== 1) return null;
  const order = [...(found[0] as string[])];
  if (kind === 'spare-block') order.push(idOf(all.at(-1) as string));
  if (order.every((id, i) => id === ids[i])) return null;

  const source = used.join('\n');
  const program = compile(source);
  if (program === null) return null;
  const run = runTraced(program);
  for (const step of run.trace)
    for (const value of Object.values(step.variables))
      if (!isInteger(value) || Math.abs(value) > MAX_VALUE) return null;

  const items = shownCode.map((code, i) => ({
    id: ids[i] as string,
    label: itemLabel(ids[i] as string, code),
  }));
  const response: ResponseOf<'ordering'> = {
    format: 'ordering',
    question: { items },
    solution: { order },
  };
  const checked = arrangements(all.length, used.length);
  // "4, then 9, then 12": each printed line in turn.
  const printed = target
    .slice(1)
    .reduce<Text>(
      (before, after) => msg('programming:algorithmConstruction.then', { before, after }),
      target[0] as string,
    );
  const hasSpare = kind === 'spare-block';
  return {
    prompt: msg(
      hasSpare
        ? 'programming:algorithmConstruction.prompt.spareBlock'
        : 'programming:algorithmConstruction.prompt.orderBlocks',
      { printed },
    ),
    content: {
      kind,
      blocks: shownCode.map((code, i) => ({ id: ids[i] as string, code })),
      target,
      ordersChecked: checked,
    },
    response,
    explanation: msg(
      hasSpare
        ? 'programming:algorithmConstruction.explanation.spareBlock'
        : 'programming:algorithmConstruction.explanation.orderBlocks',
      {
        order: order.slice(0, used.length).join(' → '),
        printed,
        count: checked,
        spare: hasSpare ? idOf(all.at(-1) as string) : '',
        steps: narrateText(source, run, 16),
      },
    ),
    skills: ['algorithmic-thinking', 'decomposition', 'sequential-thinking'],
  };
}

export function generateConstruction(random: RandomGenerator, profile: ConstructionProfile): Draft {
  const kind = weightedPick(random, profile.kinds);
  return retryGeneration(
    `algorithm-construction ${kind}`,
    () => candidate(random, profile, kind),
    400,
  );
}
