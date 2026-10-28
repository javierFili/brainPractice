import type { GameDefinition } from '@/domain/game';
import { gameIdOf } from '@/domain/shared';
import { generateConstruction } from './generate';
import { CONSTRUCTION_LEVELS } from './levels';
import type { ConstructionChallenge, ConstructionProfile } from './types';

export const ALGORITHM_CONSTRUCTION_ID = gameIdOf('algorithm-construction');

export const algorithmConstructionGame: GameDefinition<ConstructionChallenge, ConstructionProfile> =
  {
    id: ALGORITHM_CONSTRUCTION_ID,
    name: 'Algorithm Construction',
    tagline: 'Put the blocks in the order that works.',
    description:
      'You get the pieces of a program and the output it must print. Arrange the blocks so it prints exactly that; later levels add loops and a spare block that is not needed.',
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
      scoringSummary:
        'An order counts as correct only when it is the single order that prints the target; every possible order is checked with the interpreter when the challenge is made. Untimed, with a small bonus for pace.',
      feedback: 'explain',
    },
    instructions: [
      'The program must print exactly the output shown above the blocks.',
      'A line can only use a variable that an earlier block has already set.',
      'Move blocks with the ↑ / ↓ buttons, then submit. Loop blocks move as a whole.',
      'From level 6 one block is a spare: the program does not use it — move it to the end.',
    ],
    simpleInstructions: 'Put the code blocks in the order that prints the number shown.',
    levels: CONSTRUCTION_LEVELS,
    generate({ identity, profile, random }) {
      return { ...identity, ...generateConstruction(random, profile), timing: profile.timing };
    },
  };
