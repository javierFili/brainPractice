import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { SPEED_SCORING, fixedChoice } from '@/games/speed/shared/content';
import { SYMBOL_MATCH_LEVELS } from './levels';
import { differences, mutate, randomString } from './symbols';
import type { SymbolMatchChallenge, SymbolMatchProfile } from './types';

export const SAME_DIFFERENT = [
  msg('speed:rapidSymbolMatching.same'),
  msg('speed:rapidSymbolMatching.different'),
] as const;

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
  name: msg('speed:rapidSymbolMatching.name'),
  tagline: msg('speed:rapidSymbolMatching.tagline'),
  description: msg('speed:rapidSymbolMatching.description'),
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
    scoringSummary: msg('speed:rapidSymbolMatching.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('speed:rapidSymbolMatching.accessibilityNotes'),
  },
  instructions: [
    msg('speed:rapidSymbolMatching.instructions.sameDifferent'),
    msg('speed:rapidSymbolMatching.instructions.findCopy'),
    msg('speed:rapidSymbolMatching.instructions.checkEvery'),
  ],
  simpleInstructions: msg('speed:rapidSymbolMatching.simpleInstructions'),
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
          prompt: msg('speed:rapidSymbolMatching.prompt.sameDifferent'),
          content: { kind, pool: profile.pool, reference, other },
          response: fixedChoice(SAME_DIFFERENT, same ? 0 : 1),
          explanation: same
            ? msg('speed:rapidSymbolMatching.explanation.same')
            : msg('speed:rapidSymbolMatching.explanation.different', { reference, other }),
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
        prompt: msg('speed:rapidSymbolMatching.prompt.findMatch'),
        content: { kind, pool: profile.pool, reference, other: null },
        response: singleChoice(random, reference, [...distractors]),
        explanation: msg('speed:rapidSymbolMatching.explanation.findMatch', { reference }),
        timing: profile.timing,
      };
    });
  },
};
