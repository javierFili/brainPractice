import type { GameDefinition } from '@/domain/game';
import { weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
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
  name: 'Bug Hunter',
  tagline: 'One artifact, a few rules, exactly one bug.',
  description:
    'Scan logs, data records and pseudocode against explicit rules and point at the single item that breaks one. Trains selective and sustained attention, anomaly detection and debugging.',
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
    scoringSummary:
      'Points for each anomaly found, scaled by level, with pace and streak bonuses. Accuracy is 75% of the performance index.',
    feedback: 'explain',
  },
  instructions: [
    'Read the rules first: only the stated rules count, not what “looks” wrong.',
    'Then check the items one by one. Exactly one item breaks exactly one rule.',
    'Rules about “the item above” compare each item only with its direct neighbour.',
    'Many items are near-misses — unusual but legal. Click (or press Enter on) the bug to answer.',
  ],
  levels: BUG_HUNTER_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
