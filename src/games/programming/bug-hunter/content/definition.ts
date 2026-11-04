import type { GameDefinition } from '@/domain/game';
import { weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { codeRule } from './generators/code';
import type { BugHunterDraft } from './generators/draft';
import { multiRule, schemaViolation, sequenceAnomaly } from './generators/records';
import { BUG_HUNTER_LEVELS } from './levels';
import type { AttentionChallenge, BugHunterKind, BugHunterProfile } from './types';

const GENERATORS: Record<
  BugHunterKind,
  (random: RandomGenerator, profile: BugHunterProfile) => BugHunterDraft
> = {
  'sequence-anomaly': sequenceAnomaly,
  'schema-violation': schemaViolation,
  'code-rule': codeRule,
  'multi-rule': multiRule,
};

export const BUG_HUNTER_GAME_ID = gameIdOf('bug-hunter');

export const bugHunterGame: GameDefinition<AttentionChallenge, BugHunterProfile> = {
  id: BUG_HUNTER_GAME_ID,
  name: msg('programming:bugHunter.name'),
  tagline: msg('programming:bugHunter.tagline'),
  description: msg('programming:bugHunter.description'),
  area: 'attention',
  skills: ['attention', 'debugging', 'abstraction', 'pattern-recognition'],
  meta: {
    category: 'programming',
    audiences: ['programmers', 'adults', 'teens'],
    interaction: 'mixed',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time', 'streak'],
    scoringSummary: msg('programming:bugHunter.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('programming:bugHunter.instructions.rules'),
    msg('programming:bugHunter.instructions.check'),
    msg('programming:bugHunter.instructions.above'),
    msg('programming:bugHunter.instructions.nearMisses'),
  ],
  levels: BUG_HUNTER_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
