import type { GameDefinition } from '@/domain/game';
import { gameIdOf, msg } from '@/domain/shared';
import { generateDependency } from './generate';
import { DEPENDENCY_LEVELS } from './levels';
import type { DependencyChallenge, DependencyProfile } from './types';

export const DEPENDENCY_ORDERING_ID = gameIdOf('dependency-ordering');

export const dependencyOrderingGame: GameDefinition<DependencyChallenge, DependencyProfile> = {
  id: DEPENDENCY_ORDERING_ID,
  name: msg('programming:dependencyOrdering.name'),
  tagline: msg('programming:dependencyOrdering.tagline'),
  description: msg('programming:dependencyOrdering.description'),
  area: 'logic',
  skills: ['planning', 'logical-reasoning', 'algorithmic-thinking', 'decomposition'],
  meta: {
    category: 'programming',
    audiences: ['programmers', 'teens', 'adults'],
    interaction: 'mixed',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time', 'streak'],
    scoringSummary: msg('programming:dependencyOrdering.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('programming:dependencyOrdering.instructions.needs'),
    msg('programming:dependencyOrdering.instructions.listed'),
    msg('programming:dependencyOrdering.instructions.arrows'),
    msg('programming:dependencyOrdering.instructions.cycle'),
  ],
  simpleInstructions: msg('programming:dependencyOrdering.simpleInstructions'),
  levels: DEPENDENCY_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...generateDependency(random, profile), timing: profile.timing };
  },
};
