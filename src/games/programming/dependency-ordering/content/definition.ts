import type { GameDefinition } from '@/domain/game';
import { gameIdOf } from '@/domain/shared';
import { generateDependency } from './generate';
import { DEPENDENCY_LEVELS } from './levels';
import type { DependencyChallenge, DependencyProfile } from './types';

export const DEPENDENCY_ORDERING_ID = gameIdOf('dependency-ordering');

export const dependencyOrderingGame: GameDefinition<DependencyChallenge, DependencyProfile> = {
  id: DEPENDENCY_ORDERING_ID,
  name: 'Dependency Ordering',
  tagline: 'What has to happen before what?',
  description:
    'Build steps, kitchen prep and release tasks, each with the tasks it needs. Find what can start, what is unblocked, a complete valid order — and which new need would create a cycle.',
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
    scoringSummary:
      'Each question has exactly one right answer, checked by a graph solver. Your result is the share answered correctly, with a small bonus for pace; answering is not timed.',
    feedback: 'explain',
  },
  instructions: [
    '“A needs B” means B must be finished before A can start.',
    'Only the listed needs count — not what you would do in a real kitchen or project.',
    'To order tasks, use the arrow buttons next to each one, then submit.',
    'A cycle (A needs B, B needs A, possibly through other tasks) makes every order impossible.',
  ],
  simpleInstructions: 'Do each task only after the tasks it needs are done.',
  levels: DEPENDENCY_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...generateDependency(random, profile), timing: profile.timing };
  },
};
