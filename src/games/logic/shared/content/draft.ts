import type { Challenge, ChallengeIdentity, ResponseOf } from '@/domain/challenge';
import { shuffle, type RandomGenerator } from '@/domain/random';
import { textId, type Text } from '@/domain/shared';

/** What a generator produces; the definition stamps identity and timing. */
export type Draft<C extends Challenge> = Omit<C, keyof ChallengeIdentity | 'timing'>;

const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

const assertDistinct = (labels: readonly Text[]) => {
  if (new Set(labels.map(textId)).size !== labels.length)
    throw new Error(`Duplicate options: ${labels.map(textId).join(' | ')}`);
};

/**
 * Single-choice response with the correct label shuffled among distractors, like
 * `singleChoice` (same single shuffle, so the random draws are identical) but for translatable
 * labels.
 */
export function textChoice(
  random: RandomGenerator,
  correct: Text,
  distractors: readonly Text[],
): ResponseOf<'single-choice'> {
  const labels = [correct, ...distractors];
  assertDistinct(labels);
  if (labels.length > IDS.length) throw new Error(`At most ${IDS.length} options are supported`);
  const options = shuffle(random, labels).map((label, i) => ({ id: IDS[i] as string, label }));
  const solution = options.find((option) => textId(option.label) === textId(correct)) as {
    id: string;
  };
  return { format: 'single-choice', question: { options }, solution: { optionId: solution.id } };
}

/**
 * Single-choice response whose options keep the given order (e.g. "Must be true / Must be false /
 * Can't tell"). Only use it when the generator balances which option is correct, so the answer
 * position stays unbiased.
 */
export function fixedChoice(labels: readonly Text[], correct: Text): ResponseOf<'single-choice'> {
  assertDistinct(labels);
  const index = labels.map(textId).indexOf(textId(correct));
  if (index === -1) throw new Error(`"${textId(correct)}" is not an option`);
  return {
    format: 'single-choice',
    question: { options: labels.map((label, i) => ({ id: IDS[i] as string, label })) },
    solution: { optionId: IDS[index] as string },
  };
}

/** Ordering response: items shown in `shown` order, solved by `solution` (both lists of labels). */
export function orderingResponse(
  shown: readonly string[],
  solution: readonly string[],
): ResponseOf<'ordering'> {
  const id = (label: string) => `i${shown.indexOf(label)}`;
  return {
    format: 'ordering',
    question: { items: shown.map((label) => ({ id: id(label), label })) },
    solution: { order: solution.map(id) },
  };
}
