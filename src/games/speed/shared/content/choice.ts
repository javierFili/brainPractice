import type { ResponseOf } from '@/domain/challenge';

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/**
 * Single-choice response whose options keep a fixed order (same key for the same answer on every
 * trial), as speed tasks need a stable response mapping. Callers must pick `correctIndex`
 * uniformly so the answer position carries no clue.
 */
export function fixedChoice(
  labels: readonly string[],
  correctIndex: number,
): ResponseOf<'single-choice'> {
  if (new Set(labels).size !== labels.length)
    throw new Error(`Duplicate options: ${labels.join(' | ')}`);
  if (labels.length < 2 || labels.length > OPTION_IDS.length)
    throw new RangeError(`Between 2 and ${OPTION_IDS.length} options are supported`);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= labels.length)
    throw new RangeError(`correctIndex ${correctIndex} is out of range`);
  const options = labels.map((label, i) => ({ id: OPTION_IDS[i] as string, label }));
  return {
    format: 'single-choice',
    question: { options },
    solution: { optionId: (options[correctIndex] as { id: string }).id },
  };
}
