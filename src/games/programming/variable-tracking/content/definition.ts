import type { GameDefinition } from '@/domain/game';
import { gameIdOf } from '@/domain/shared';
import { generateTracking } from './generate';
import { TRACKING_LEVELS } from './levels';
import type { TrackingChallenge, TrackingProfile } from './types';

export const VARIABLE_TRACKING_ID = gameIdOf('variable-tracking');

export const variableTrackingGame: GameDefinition<TrackingChallenge, TrackingProfile> = {
  id: VARIABLE_TRACKING_ID,
  name: 'Variable Tracking',
  tagline: 'Keep every variable straight, line by line.',
  description:
    'A short program updates several variables with assignments, copies and swaps. Follow it line by line and say what a variable holds at the end, at a given line, or which one ends up largest.',
  area: 'memory',
  skills: ['working-memory', 'algorithmic-thinking', 'sequential-thinking', 'concentration'],
  meta: {
    category: 'programming',
    audiences: ['programmers', 'teens', 'adults'],
    interaction: 'mixed',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time', 'streak'],
    scoringSummary:
      'Each question has one exact answer, computed by running the program. Your result is the share answered correctly, with a small bonus for pace; nothing is timed out.',
    feedback: 'explain',
  },
  instructions: [
    'The program runs from top to bottom, one line at a time.',
    '“x = y” copies the value y has right now; changing y later does not change x.',
    'A swap uses a helper: temp = a, a = b, b = temp.',
    'From level 4 you type the exact number. After answering, the full trace is shown.',
  ],
  simpleInstructions: 'Read the lines one by one and keep track of each box’s number.',
  levels: TRACKING_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...generateTracking(random, profile), timing: profile.timing };
  },
};
