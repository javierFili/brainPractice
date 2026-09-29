import type { ChallengeIdentity } from '@/domain/challenge';
import type { PatternChallenge } from '../types';

/** What a Pattern Architect generator produces; identity and timing are stamped by the definition. */
export type PatternDraft = Omit<PatternChallenge, keyof ChallengeIdentity | 'timing'>;

/** Adds each candidate once, skipping the answer and duplicates, until `count` are collected. */
export function pickDistractors(
  answer: string,
  candidates: readonly string[],
  count: number,
): string[] | null {
  const chosen: string[] = [];
  for (const candidate of candidates) {
    if (chosen.length === count) break;
    if (candidate !== answer && !chosen.includes(candidate)) chosen.push(candidate);
  }
  return chosen.length === count ? chosen : null;
}
