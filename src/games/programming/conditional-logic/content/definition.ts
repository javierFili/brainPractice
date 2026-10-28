import type { GameDefinition } from '@/domain/game';
import { gameIdOf } from '@/domain/shared';
import { generateConditional } from './generate';
import { CONDITIONAL_LEVELS } from './levels';
import type { ConditionalChallenge, ConditionalProfile } from './types';

export const CONDITIONAL_LOGIC_ID = gameIdOf('conditional-logic');

export const conditionalLogicGame: GameDefinition<ConditionalChallenge, ConditionalProfile> = {
  id: CONDITIONAL_LOGIC_ID,
  name: 'Conditional Logic',
  tagline: 'Which branch runs?',
  description:
    'Read if / elif / else chains with and, or and not, and decide what a program prints for given inputs — or which input leads to a given output. Later levels nest conditions and test short-circuit evaluation.',
  area: 'logic',
  skills: ['logical-reasoning', 'algorithmic-thinking', 'debugging', 'problem-solving'],
  meta: {
    category: 'programming',
    audiences: ['programmers', 'teens', 'adults'],
    interaction: 'choice',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time', 'streak'],
    scoringSummary:
      'Every answer is checked by running the program with the interpreter. Your result is the share answered correctly, with a small bonus for pace; answering is not timed.',
    feedback: 'explain',
  },
  instructions: [
    'Conditions are checked from the top: the first true one runs its block, the rest are skipped.',
    '“and” needs both sides true; “or” needs at least one; “not” flips true and false.',
    'Some questions give you an output and ask which input produces it.',
    'From level 8: “and” stops at the first false side and “or” at the first true one — a division the program never reaches cannot fail.',
  ],
  simpleInstructions:
    'Check each condition from the top; the first true one decides what is printed.',
  levels: CONDITIONAL_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...generateConditional(random, profile), timing: profile.timing };
  },
};
