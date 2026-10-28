import { shuffle, type RandomGenerator } from '../random';
import type { ChoiceOption, ResponseOf } from './responseFormats';

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/**
 * Single-choice response with the correct label shuffled among distractors. Rejects duplicates so
 * a challenge can never have two identical (ambiguous) options.
 */
export function singleChoice(
  random: RandomGenerator,
  correct: string,
  distractors: readonly string[],
): ResponseOf<'single-choice'> {
  const labels = [correct, ...distractors];
  if (new Set(labels).size !== labels.length)
    throw new Error(`Duplicate options: ${labels.join(' | ')}`);
  if (labels.length > OPTION_IDS.length)
    throw new Error(`At most ${OPTION_IDS.length} options are supported`);
  const options = shuffle(random, labels).map((label, i) => ({
    id: OPTION_IDS[i] as string,
    label,
  }));
  const solution = options.find((option) => option.label === correct) as { id: string };
  return { format: 'single-choice', question: { options }, solution: { optionId: solution.id } };
}

export const numericResponse = (value: number, unit?: string): ResponseOf<'numeric'> => ({
  format: 'numeric',
  question: unit === undefined ? {} : { unit },
  solution: { value },
});

export const locateResponse = (itemCount: number, index: number): ResponseOf<'locate'> => ({
  format: 'locate',
  question: { itemCount },
  solution: { index },
});

export const multiSelectResponse = (
  itemCount: number,
  indices: readonly number[],
  { exact = true, maxErrors = 0 }: { exact?: boolean; maxErrors?: number } = {},
): ResponseOf<'multi-select'> => ({
  format: 'multi-select',
  question: { itemCount, exactCount: exact ? indices.length : null, maxErrors },
  solution: { indices: [...indices].sort((a, b) => a - b) },
});

/** Sequence response over a palette of `[id, label]` symbols. */
export const sequenceResponse = (
  symbols: readonly ChoiceOption[],
  sequence: readonly string[],
): ResponseOf<'sequence'> => ({
  format: 'sequence',
  question: { symbols, length: sequence.length },
  solution: { sequence },
});

export const tapResponse = (
  shouldTap: boolean,
  signalDelayMs: number,
  windowMs: number,
): ResponseOf<'tap'> => ({
  format: 'tap',
  question: { signalDelayMs, windowMs },
  solution: { shouldTap },
});

export const pairsResponse = (
  pairs: readonly (readonly [number, number])[],
  maxMisses: number,
): ResponseOf<'pairs'> => ({
  format: 'pairs',
  question: { itemCount: pairs.length * 2, maxMisses },
  solution: { pairs },
});
