import type { GameDefinition } from '@/domain/game';
import { weightedPick } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
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
  name: msg('programming:algorithmicLogic.name'),
  tagline: msg('programming:algorithmicLogic.tagline'),
  description: msg('programming:algorithmicLogic.description'),
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
    scoringSummary: msg('programming:algorithmicLogic.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('programming:algorithmicLogic.instructions.read'),
    msg('programming:algorithmicLogic.instructions.arrow'),
    msg('programming:algorithmicLogic.instructions.pseudocode'),
    msg('programming:algorithmicLogic.instructions.exact'),
  ],
  levels: LOGIC_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
