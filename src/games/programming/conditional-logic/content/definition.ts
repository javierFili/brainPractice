import type { GameDefinition } from '@/domain/game';
import { gameIdOf, msg } from '@/domain/shared';
import { generateConditional } from './generate';
import { CONDITIONAL_LEVELS } from './levels';
import type { ConditionalChallenge, ConditionalProfile } from './types';

export const CONDITIONAL_LOGIC_ID = gameIdOf('conditional-logic');

export const conditionalLogicGame: GameDefinition<ConditionalChallenge, ConditionalProfile> = {
  id: CONDITIONAL_LOGIC_ID,
  name: msg('programming:conditionalLogic.name'),
  tagline: msg('programming:conditionalLogic.tagline'),
  description: msg('programming:conditionalLogic.description'),
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
    scoringSummary: msg('programming:conditionalLogic.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('programming:conditionalLogic.instructions.order'),
    msg('programming:conditionalLogic.instructions.operators'),
    msg('programming:conditionalLogic.instructions.backwards'),
    msg('programming:conditionalLogic.instructions.shortCircuit'),
  ],
  simpleInstructions: msg('programming:conditionalLogic.simpleInstructions'),
  levels: CONDITIONAL_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...generateConditional(random, profile), timing: profile.timing };
  },
};
