import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { SPEED_SCORING, fixedChoice } from '@/games/speed/shared/content';
import { SYMBOL_MATCH_LEVELS } from './levels';
import { differences, mutate, randomString } from './symbols';
import type { SymbolMatchChallenge, SymbolMatchProfile } from './types';

export const SAME_DIFFERENT = ['Same', 'Different'] as const;

/** A copy of `text` altered by the profile's mutations, or null when the candidate is unusable. */
function alteredCopy(
  random: RandomGenerator,
  text: string,
  profile: SymbolMatchProfile,
): string | null {
  let copy: string | null = text;
  for (let i = 0; i < profile.changes && copy !== null; i++)
    copy = mutate(random, profile.pool, copy, pick(random, profile.mutations));
  if (copy === null || differences(copy, text) < Math.min(profile.changes, 2)) return null;
  return copy;
}

export const RAPID_SYMBOL_MATCHING_ID = gameIdOf('rapid-symbol-matching');

export const rapidSymbolMatchingGame: GameDefinition<SymbolMatchChallenge, SymbolMatchProfile> = {
  id: RAPID_SYMBOL_MATCHING_ID,
  name: 'Rapid Symbol Matching',
  tagline: 'Same or different? Look closely, answer fast.',
  description:
    'Compare short strings of letters and symbols: are the two the same, or which candidate is an exact copy? Strings grow longer, symbols become look-alikes (b, d, p, q) and changes become subtler, down to two neighbours swapped.',
  area: 'speed',
  skills: ['processing-speed', 'selective-attention', 'error-detection'],
  meta: {
    category: 'speed',
    audiences: ['kids', 'teens', 'adults', 'seniors', 'programmers'],
    interaction: 'choice',
    estimatedMinutes: 2,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time'],
    scoringSummary:
      'Each comparison is right or wrong; a wrong answer costs points. A correct answer earns more the faster it comes, but accuracy carries most of the result. Relaxed timing removes the time limit.',
    feedback: 'brief',
    accessibilityNotes:
      'The task is visual. Strings are also announced symbol by symbol (“small b, capital Q…”), which makes the comparison possible by listening but much slower.',
  },
  instructions: [
    'Same or different: press 1 if both strings are identical, 2 if anything differs.',
    'Find the copy: pick the candidate that is exactly the same as the reference.',
    'Check every symbol and its position — swapped neighbours count as different.',
  ],
  simpleInstructions: 'Are the two the same? Answer as fast as you can.',
  levels: SYMBOL_MATCH_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return retryGeneration('a symbol comparison', () => {
      const reference = randomString(random, profile.pool, profile.length);
      if (kind === 'same-different') {
        const same = chance(random, 0.5);
        const other = same ? reference : alteredCopy(random, reference, profile);
        if (other === null) return null;
        return {
          ...identity,
          skills: ['processing-speed', 'error-detection'],
          prompt: 'Same or different?',
          content: { kind, pool: profile.pool, reference, other },
          response: fixedChoice(SAME_DIFFERENT, same ? 0 : 1),
          explanation: same
            ? 'Both strings are identical.'
            : `They differ: ${reference} vs ${other}.`,
          timing: profile.timing,
        };
      }
      const distractors = new Set<string>();
      for (let i = 0; i < 20 && distractors.size < profile.optionCount - 1; i++) {
        const copy = alteredCopy(random, reference, profile);
        if (copy !== null) distractors.add(copy);
      }
      if (distractors.size < profile.optionCount - 1) return null;
      return {
        ...identity,
        skills: ['processing-speed', 'selective-attention', 'error-detection'],
        prompt: 'Which one is an exact copy?',
        content: { kind, pool: profile.pool, reference, other: null },
        response: singleChoice(random, reference, [...distractors]),
        explanation: `${reference} is the only exact copy; every other candidate changes a symbol or its position.`,
        timing: profile.timing,
      };
    });
  },
};
