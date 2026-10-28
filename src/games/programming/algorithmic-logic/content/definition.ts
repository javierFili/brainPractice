import type { GameDefinition } from '@/domain/game';
import { weightedPick } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { constraintArrangement } from './generators/constraints';
import type { LogicDraft } from './generators/draft';
import { criticalPathChallenge, dependencyCount, dependencyOrder } from './generators/graphs';
import { programTrace } from './generators/programs';
import { LOGIC_LEVELS } from './levels';
import type { LogicChallenge, LogicKind, LogicProfile } from './types';

const GENERATORS: Record<LogicKind, (...args: Parameters<typeof programTrace>) => LogicDraft> = {
  'dependency-order': dependencyOrder,
  'dependency-count': dependencyCount,
  'critical-path': criticalPathChallenge,
  'program-trace': programTrace,
  'constraint-arrangement': constraintArrangement,
};

export const LOGIC_GAME_ID = gameIdOf('algorithmic-logic');

export const logicGame: GameDefinition<LogicChallenge, LogicProfile> = {
  id: LOGIC_GAME_ID,
  name: 'Algorithm Tracing',
  tagline: 'Dependencies, traces and constraints.',
  description:
    'Order tasks that depend on each other, trace language-neutral pseudocode and solve deployment puzzles. Trains deduction, conditional reasoning and algorithmic thinking.',
  area: 'logic',
  skills: ['logical-reasoning', 'algorithmic-thinking', 'decomposition', 'working-memory'],
  meta: {
    category: 'programming',
    audiences: ['programmers', 'adults', 'teens'],
    interaction: 'mixed',
    estimatedMinutes: 6,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time', 'streak'],
    scoringSummary:
      'Points for each correct answer, scaled by level, with a bonus for pace and streaks; a wrong answer costs a quarter of the base. Accuracy is 75% of the performance index.',
    feedback: 'explain',
  },
  instructions: [
    'Read the whole challenge before answering: every rule, arrow and line matters.',
    'An arrow “x → y” means x must finish before y starts.',
    'Pseudocode runs top to bottom; “set a ← b + 1” stores the new value in a.',
    'From level 4 some answers are exact numbers — work them out, there are no options to guess from.',
  ],
  levels: LOGIC_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
