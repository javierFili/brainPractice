import type { Challenge, ChallengeIdentity, ResponseOf } from '@/domain/challenge';

/** What a generator produces; the definition stamps identity and timing. */
export type Draft<C extends Challenge> = Omit<C, keyof ChallengeIdentity | 'timing'>;

const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/**
 * Single-choice response whose options keep the given order (e.g. "Must be true / Must be false /
 * Can't tell"). Only use it when the generator balances which option is correct, so the answer
 * position stays unbiased.
 */
export function fixedChoice(
  labels: readonly string[],
  correct: string,
): ResponseOf<'single-choice'> {
  if (new Set(labels).size !== labels.length) throw new Error('Duplicate options');
  const index = labels.indexOf(correct);
  if (index === -1) throw new Error(`"${correct}" is not an option`);
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
