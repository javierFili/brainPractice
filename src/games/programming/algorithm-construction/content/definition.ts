import type { GameDefinition } from '@/domain/game';
import { gameIdOf, msg } from '@/domain/shared';
import { generateConstruction } from './generate';
import { CONSTRUCTION_LEVELS } from './levels';
import type { ConstructionChallenge, ConstructionProfile } from './types';

export const ALGORITHM_CONSTRUCTION_ID = gameIdOf('algorithm-construction');

export const algorithmConstructionGame: GameDefinition<ConstructionChallenge, ConstructionProfile> =
  {
    id: ALGORITHM_CONSTRUCTION_ID,
    name: msg('programming:algorithmConstruction.name'),
    tagline: msg('programming:algorithmConstruction.tagline'),
    description: msg('programming:algorithmConstruction.description'),
    area: 'logic',
    skills: ['algorithmic-thinking', 'decomposition', 'sequential-thinking', 'planning'],
    meta: {
      category: 'programming',
      audiences: ['programmers', 'teens', 'adults'],
      interaction: 'ordering',
      estimatedMinutes: 6,
      keyboard: 'full',
      relaxedFriendly: true,
      measures: ['accuracy', 'response-time', 'streak'],
      scoringSummary: msg('programming:algorithmConstruction.scoringSummary'),
      feedback: 'explain',
    },
    instructions: [
      msg('programming:algorithmConstruction.instructions.target'),
      msg('programming:algorithmConstruction.instructions.variables'),
      msg('programming:algorithmConstruction.instructions.move'),
      msg('programming:algorithmConstruction.instructions.spare'),
    ],
    simpleInstructions: msg('programming:algorithmConstruction.simpleInstructions'),
    levels: CONSTRUCTION_LEVELS,
    generate({ identity, profile, random }) {
      return { ...identity, ...generateConstruction(random, profile), timing: profile.timing };
    },
  };
