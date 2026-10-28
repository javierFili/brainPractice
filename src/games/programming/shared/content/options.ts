import { singleChoice, type ResponseOf } from '@/domain/challenge';
import type { RandomGenerator } from '@/domain/random';
import { rankedNumericOptions } from '@/games/kit/content';

/**
 * Number options in which the answer's rank is uniform (neither the middle nor an extreme gives
 * it away). Wider values get wider spacing so options are not all off-by-one.
 */
export function numberChoice(
  random: RandomGenerator,
  correct: number,
  { count = 4, min = Number.NEGATIVE_INFINITY }: { count?: number; min?: number } = {},
): ResponseOf<'single-choice'> {
  const step = Math.abs(correct) >= 20 ? 3 : Math.abs(correct) >= 8 ? 2 : 1;
  const values = rankedNumericOptions(random, correct, count, {
    step,
    min,
    jitter: step - 1,
  });
  return singleChoice(random, String(correct), values.filter((v) => v !== correct).map(String));
}
