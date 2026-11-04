import { singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { chance, pick, randomInt, type RandomGenerator } from '@/domain/random';
import {
  catalogOps,
  describeListOp,
  formatList,
  LIST_OP_CATALOG,
  LIST_SPACE,
  siblingsOf,
} from '../solvers/listOps';
import {
  enumerateBehaviours,
  infer,
  mismatches,
  reorderings,
  searchPrograms,
  trace,
  withoutOneStep,
  type Behaviour,
} from '../solvers/programSpace';
import { joinText, msg } from '@/domain/shared';
import type { ListOp, PatternProfile } from '../types';
import { pickDistractors, type PatternDraft } from './draft';

type List = readonly number[];

const MIN_EXAMPLES = 2;
const MAX_OUTPUT_LENGTH = 10;

/** Digits 0–9, lengths around `size`, sometimes with a repeated value so "remove repeats" shows. */
function randomList(random: RandomGenerator, size: number): number[] {
  const length = Math.max(3, randomInt(random, size - 1, size + 1));
  const list = Array.from({ length }, () => randomInt(random, 0, 9));
  if (chance(random, 0.35)) list[randomInt(random, 1, length - 1)] = list[0] as number;
  return list;
}

/** What kind of change a step makes; composed programs mix at least two kinds. */
const CATEGORY: Readonly<Record<ListOp['op'], 'order' | 'values' | 'selection'>> = {
  reverse: 'order',
  'sort-ascending': 'order',
  'sort-descending': 'order',
  'rotate-left': 'order',
  'rotate-right': 'order',
  'swap-pairs': 'order',
  add: 'values',
  double: 'values',
  'running-total': 'values',
  'drop-first': 'selection',
  'drop-last': 'selection',
  'take-first': 'selection',
  'keep-even': 'selection',
  'keep-odd': 'selection',
  'remove-repeats': 'selection',
  'duplicate-each': 'selection',
};

/** Rejects programs that read as padding: a step repeated back to back, or a single kind of change. */
export function isInteresting(program: readonly ListOp[]): boolean {
  if (program.some((op, i) => i > 0 && program[i - 1]?.op === op.op)) return false;
  return program.length < 2 || new Set(program.map((op) => CATEGORY[op.op])).size >= 2;
}

/** True when every step changes the value it receives (no step is invisible on this input). */
export const everyStepVisible = (values: readonly string[]) =>
  values.every((value, i) => i === 0 || value !== values[i - 1]);

const run = (program: readonly ListOp[], input: List) =>
  trace(LIST_SPACE, program, input).at(-1) as List;

/** Round-robin over several ranked lists so each kind of wrong reasoning is represented. */
export function interleave<T>(lists: readonly (readonly T[])[]): T[] {
  const longest = Math.max(0, ...lists.map((l) => l.length));
  return Array.from({ length: longest }, (_, i) =>
    lists.flatMap((l) => (i < l.length ? [l[i] as T] : [])),
  ).flat();
}

/**
 * Distractors from wrong hypotheses: the right steps in the wrong order, a step forgotten, a
 * program that fits every example but one, and a look-alike step swapped in.
 */
function wrongOutputs(
  program: readonly ListOp[],
  question: List,
  behaviours: readonly Behaviour<List, ListOp>[],
  expected: readonly string[],
  questionIndex: number,
): string[] {
  const outputsOf = (programs: readonly (readonly ListOp[])[]) =>
    programs
      .map((p) => run(p, question))
      .filter((o) => o.length > 0)
      .map(formatList);
  const nearMisses = behaviours
    .filter((b) => mismatches(b, expected) === 1 && (b.outputs[questionIndex] as List).length > 0)
    .sort((a, b) => a.program.length - b.program.length)
    .map((b) => b.keys[questionIndex] as string);
  const swapped = program.flatMap((op, i) =>
    siblingsOf(op).map((sibling) => [...program.slice(0, i), sibling, ...program.slice(i + 1)]),
  );
  return interleave([
    outputsOf(reorderings(program)),
    outputsOf(withoutOneStep(program)),
    nearMisses,
    outputsOf(swapped),
    // Last resort: a single step that looks plausible on its own.
    outputsOf(LIST_OP_CATALOG.map((op) => [op])),
  ]);
}

export function transformInference(random: RandomGenerator, profile: PatternProfile): PatternDraft {
  const { depth, primitives, elementCount, maxExamples } = profile.transform;
  const ops = catalogOps(primitives);
  return retryGeneration('transform inference', () => {
    const program = Array.from({ length: depth }, () => pick(random, ops));
    if (!isInteresting(program)) return null;
    const inputs = Array.from({ length: maxExamples + 1 }, () => randomList(random, elementCount));
    if (new Set(inputs.map(formatList)).size < inputs.length) return null;
    const outputs = inputs.map((input) => run(program, input));
    // Every example must visibly change something and stay short enough to read.
    const readable = outputs.every(
      (o, i) =>
        o.length > 0 &&
        o.length <= MAX_OUTPUT_LENGTH &&
        formatList(o) !== formatList(inputs[i] as List),
    );
    if (!readable) return null;
    const questionIndex = maxExamples;
    const question = inputs[questionIndex] as List;
    const answer = outputs[questionIndex] as List;
    if (!everyStepVisible(trace(LIST_SPACE, program, question).map(formatList))) return null;
    const expected = outputs.map(formatList);
    // The whole catalogue (not just this level's steps) is searched, up to the level's depth.
    // Short programs are enumerated in full (cheap, and every near miss is available); for three
    // steps only the programs that fit the first examples are kept at the last level.
    const behaviours =
      depth <= 2
        ? enumerateBehaviours(LIST_SPACE, inputs, depth)
        : searchPrograms(LIST_SPACE, inputs, expected.slice(0, MIN_EXAMPLES), depth);
    // Show as few examples as possible: add them until the answer is forced.
    for (let shown = MIN_EXAMPLES; shown <= maxExamples; shown++) {
      const shownKeys = expected.slice(0, shown);
      const { predictions, shortest } = infer(behaviours, shownKeys, questionIndex);
      // A shorter explanation would make the level's composition depth pointless.
      if (shortest < depth || predictions.size !== 1) continue;
      const wrong = pickDistractors(
        formatList(answer),
        wrongOutputs(program, question, behaviours, shownKeys, questionIndex),
        profile.distractors,
      );
      if (wrong === null) return null;
      const steps = joinText(
        program.map((op, i) =>
          msg('programming:patternArchitect.step', { n: i + 1, step: describeListOp(op) }),
        ),
        '; ',
      );
      const path = trace(LIST_SPACE, program, question).map(formatList).join(' → ');
      return {
        prompt: msg('programming:patternArchitect.transform.prompt'),
        content: {
          kind: 'transform-inference',
          examples: inputs
            .slice(0, shown)
            .map((input, i) => ({ input, output: outputs[i] as List })),
          question,
          maxSteps: depth,
        },
        response: singleChoice(random, formatList(answer), wrong),
        explanation: msg('programming:patternArchitect.transform.explanation', {
          steps,
          path,
          answer: formatList(answer),
          count: depth,
        }),
        skills: ['abstraction', 'algorithmic-thinking', 'pattern-recognition'],
      };
    }
    return null;
  });
}
