import type { GameDefinition } from '@/domain/game';
import { weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import type { MemoryDraft } from './generators/draft';
import { positionRecall } from './generators/grid';
import { crossReference, foreignKeyJoin, recordRecall } from './generators/records';
import { sequenceRecall } from './generators/sequences';
import { variableState } from './generators/variables';
import { CODE_MEMORY_LEVELS } from './levels';
import { timingFor } from './load';
import type { CodeMemoryProfile, MemoryChallenge, MemoryKind } from './types';

const GENERATORS: Record<
  MemoryKind,
  (random: RandomGenerator, profile: CodeMemoryProfile) => MemoryDraft
> = {
  'record-recall': recordRecall,
  'cross-reference': crossReference,
  'foreign-key-join': foreignKeyJoin,
  'sequence-recall': sequenceRecall,
  'variable-state': variableState,
  'position-recall': positionRecall,
};

export const CODE_MEMORY_GAME_ID = gameIdOf('code-memory');

export const codeMemoryGame: GameDefinition<MemoryChallenge, CodeMemoryProfile> = {
  id: CODE_MEMORY_GAME_ID,
  name: 'Code Memory',
  tagline: 'Records, calls, state and positions — from memory.',
  description:
    'Study records, API call sequences, variable assignments and keyword grids, then answer once they are hidden. Trains the working, sequential and contextual memory you use when you keep a data structure or a trace in your head.',
  area: 'memory',
  skills: ['working-memory', 'attention', 'algorithmic-thinking', 'logical-reasoning'],
  meta: {
    category: 'programming',
    audiences: ['programmers', 'adults', 'teens'],
    interaction: 'mixed',
    estimatedMinutes: 5,
    keyboard: 'partial',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time', 'streak'],
    scoringSummary:
      'Points for each correct recall, scaled by level, with small pace and streak bonuses. Accuracy is 75% of the performance index.',
    feedback: 'explain',
  },
  instructions: [
    'Every challenge starts with a study phase: memorise what you see, then press “I’m ready” or wait for the timer.',
    'The material is hidden before the question appears, so you will not know in advance what is asked.',
    'Assignments run top to bottom; “y = x + 2” stores the new value in y.',
    'From level 4 some answers are exact numbers, and from level 5 you may have to rebuild a whole call order.',
  ],
  levels: CODE_MEMORY_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const draft = GENERATORS[kind](random, profile);
    return { ...identity, ...draft, timing: timingFor(draft.content, profile) };
  },
};
