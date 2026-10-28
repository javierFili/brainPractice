import type { ChallengeIdentity, ResponseOf } from '@/domain/challenge';
import type { Challenge } from '@/domain/challenge';

const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/** Single choice over labels kept in display order (e.g. "Panel 1…5"); the answer index is the caller's. */
export function orderedChoice(
  labels: readonly string[],
  correctIndex: number,
): ResponseOf<'single-choice'> {
  const options = labels.map((label, i) => ({ id: IDS[i] as string, label }));
  const solution = options[correctIndex];
  if (solution === undefined) throw new RangeError('correctIndex out of range');
  return { format: 'single-choice', question: { options }, solution: { optionId: solution.id } };
}

/** What a generator returns; the definition stamps identity and timing. */
export type Draft<C extends Challenge> = Omit<C, keyof ChallengeIdentity | 'timing'>;

export const listWords = (items: readonly string[]) =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`;
