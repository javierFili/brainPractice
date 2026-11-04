import type { ChallengeIdentity, ResponseOf } from '@/domain/challenge';
import type { Challenge } from '@/domain/challenge';
import { shuffle, type RandomGenerator } from '@/domain/random';
import { textId, type Text } from '@/domain/shared';

const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/** Single choice over labels kept in display order (e.g. "Panel 1…5"); the answer index is the caller's. */
export function orderedChoice(
  labels: readonly Text[],
  correctIndex: number,
): ResponseOf<'single-choice'> {
  const options = labels.map((label, i) => ({ id: IDS[i] as string, label }));
  const solution = options[correctIndex];
  if (solution === undefined) throw new RangeError('correctIndex out of range');
  return { format: 'single-choice', question: { options }, solution: { optionId: solution.id } };
}

/**
 * `singleChoice` for translatable labels: the correct label shuffled among distractors, with the
 * same single shuffle (so the random draws match), and duplicates rejected by identity.
 */
export function textChoice(
  random: RandomGenerator,
  correct: Text,
  distractors: readonly Text[],
): ResponseOf<'single-choice'> {
  const labels = [correct, ...distractors];
  const ids = labels.map(textId);
  if (new Set(ids).size !== labels.length) throw new Error(`Duplicate options: ${ids.join(' | ')}`);
  if (labels.length > IDS.length) throw new Error(`At most ${IDS.length} options are supported`);
  const options = shuffle(random, labels).map((label, i) => ({ id: IDS[i] as string, label }));
  const key = textId(correct);
  const solution = options.find((option) => textId(option.label) === key) as { id: string };
  return { format: 'single-choice', question: { options }, solution: { optionId: solution.id } };
}

/** What a generator returns; the definition stamps identity and timing. */
export type Draft<C extends Challenge> = Omit<C, keyof ChallengeIdentity | 'timing'>;
