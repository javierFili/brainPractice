import type { GameDefinition } from '@/domain/game';
import { weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
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
  name: msg('programming:codeMemory.name'),
  tagline: msg('programming:codeMemory.tagline'),
  description: msg('programming:codeMemory.description'),
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
    scoringSummary: msg('programming:codeMemory.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('programming:codeMemory.instructions.study'),
    msg('programming:codeMemory.instructions.hidden'),
    msg('programming:codeMemory.instructions.assignments'),
    msg('programming:codeMemory.instructions.exact'),
  ],
  levels: CODE_MEMORY_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const draft = GENERATORS[kind](random, profile);
    return { ...identity, ...draft, timing: timingFor(draft.content, profile) };
  },
};
