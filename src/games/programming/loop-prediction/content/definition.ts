import type { GameDefinition } from '@/domain/game';
import { gameIdOf, msg } from '@/domain/shared';
import { generateLoop } from './generate';
import { LOOP_LEVELS } from './levels';
import type { LoopChallenge, LoopProfile } from './types';

export const LOOP_PREDICTION_ID = gameIdOf('loop-prediction');

export const loopPredictionGame: GameDefinition<LoopChallenge, LoopProfile> = {
  id: LOOP_PREDICTION_ID,
  name: msg('programming:loopPrediction.name'),
  tagline: msg('programming:loopPrediction.tagline'),
  description: msg('programming:loopPrediction.description'),
  area: 'patterns',
  skills: ['algorithmic-thinking', 'pattern-recognition', 'working-memory', 'sequential-thinking'],
  meta: {
    category: 'programming',
    audiences: ['programmers', 'teens', 'adults'],
    interaction: 'mixed',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time', 'streak'],
    scoringSummary: msg('programming:loopPrediction.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('programming:loopPrediction.instructions.range'),
    msg('programming:loopPrediction.instructions.while'),
    msg('programming:loopPrediction.instructions.nested'),
    msg('programming:loopPrediction.instructions.return'),
  ],
  simpleInstructions: msg('programming:loopPrediction.simpleInstructions'),
  levels: LOOP_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...generateLoop(random, profile), timing: profile.timing };
  },
};
