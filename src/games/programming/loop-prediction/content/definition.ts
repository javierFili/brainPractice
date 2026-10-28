import type { GameDefinition } from '@/domain/game';
import { gameIdOf } from '@/domain/shared';
import { generateLoop } from './generate';
import { LOOP_LEVELS } from './levels';
import type { LoopChallenge, LoopProfile } from './types';

export const LOOP_PREDICTION_ID = gameIdOf('loop-prediction');

export const loopPredictionGame: GameDefinition<LoopChallenge, LoopProfile> = {
  id: LOOP_PREDICTION_ID,
  name: 'Loop Prediction',
  tagline: 'How many turns, and what is left at the end?',
  description:
    'Predict what for and while loops do: how many times a line runs, what an accumulator holds at the end, or the last value printed. Later levels nest loops and exit early.',
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
    scoringSummary:
      'Every answer comes from running the program with the interpreter. Your result is the share answered correctly, with a small bonus for pace; answering is not timed.',
    feedback: 'explain',
  },
  instructions: [
    '“for i in range(a, b)” runs with i = a, a + 1, … up to b − 1 (b itself is not included).',
    '“while” checks its condition before every turn and stops as soon as it is false.',
    'An inner loop starts again from the beginning on every turn of the outer loop.',
    '“return” inside a loop ends the whole function at once. After answering, the trace is shown.',
  ],
  simpleInstructions: 'Count the turns of the loop and keep track of the numbers as they change.',
  levels: LOOP_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...generateLoop(random, profile), timing: profile.timing };
  },
};
