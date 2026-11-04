import type { GameDefinition } from '@/domain/game';
import { gameIdOf, msg } from '@/domain/shared';
import { generateTracking } from './generate';
import { TRACKING_LEVELS } from './levels';
import type { TrackingChallenge, TrackingProfile } from './types';

export const VARIABLE_TRACKING_ID = gameIdOf('variable-tracking');

export const variableTrackingGame: GameDefinition<TrackingChallenge, TrackingProfile> = {
  id: VARIABLE_TRACKING_ID,
  name: msg('programming:variableTracking.name'),
  tagline: msg('programming:variableTracking.tagline'),
  description: msg('programming:variableTracking.description'),
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
    scoringSummary: msg('programming:variableTracking.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('programming:variableTracking.instructions.order'),
    msg('programming:variableTracking.instructions.copy'),
    msg('programming:variableTracking.instructions.swap'),
    msg('programming:variableTracking.instructions.typed'),
  ],
  simpleInstructions: msg('programming:variableTracking.simpleInstructions'),
  levels: TRACKING_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...generateTracking(random, profile), timing: profile.timing };
  },
};
