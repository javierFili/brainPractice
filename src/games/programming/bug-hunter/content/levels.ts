import { msg } from '@/domain/shared';
import type { LevelTable } from '@/domain/difficulty';
import type { BugHunterProfile, CodeRuleType, SchemaField, SequenceRuleType } from './types';

const seconds = (limit: number, target: number) => ({
  studyMs: null,
  limitMs: limit * 1000,
  targetMs: target * 1000,
});

const BASIC_SCHEMA: readonly SchemaField[] = ['id', 'email', 'status', 'retries'];
const WIDER_SCHEMA: readonly SchemaField[] = [...BASIC_SCHEMA, 'role', 'region', 'port'];
const FULL_SCHEMA: readonly SchemaField[] = [...WIDER_SCHEMA, 'version', 'timeoutMs'];

const ORDER_RULES: readonly SequenceRuleType[] = ['ascending-time', 'consecutive'];
const ALL_SEQUENCE_RULES: readonly SequenceRuleType[] = [...ORDER_RULES, 'unique'];

const NAMING_RULES: readonly CodeRuleType[] = ['defined-before-use', 'camel-case'];
const ALL_CODE_RULES: readonly CodeRuleType[] = [
  ...NAMING_RULES,
  'close-opened',
  'write-while-open',
];

const EARLY_KINDS = { 'sequence-anomaly': 1, 'schema-violation': 1, 'code-rule': 1 };
const MIXED_KINDS = { ...EARLY_KINDS, 'multi-rule': 1 };
const LATE_KINDS = {
  'sequence-anomaly': 0.75,
  'schema-violation': 1,
  'code-rule': 1,
  'multi-rule': 1.5,
};

/**
 * Level design for Bug Hunter (rationale per level in docs/game-design/bug-hunter.md).
 * Difficulty grows on several axes at once — items, rules checked per item, unrelated fields,
 * near-miss decoys and how close the bug is to a legal value — and new rule families appear
 * instead of just longer lists.
 */
export const BUG_HUNTER_LEVELS: LevelTable<BugHunterProfile> = {
  1: {
    level: 1,
    tier: 'fundamentals',
    objective: msg('programming:bugHunter.levels.1'),
    challengeCount: 6,
    timing: seconds(60, 20),
    kinds: { 'sequence-anomaly': 1, 'schema-violation': 1 },
    elementCount: 6,
    decisionCount: 1,
    visualNoise: 0,
    distractors: 1,
    violation: 'obvious',
    sequenceRules: ORDER_RULES,
    schemaFields: BASIC_SCHEMA,
    codeRules: NAMING_RULES,
  },
  2: {
    level: 2,
    tier: 'fundamentals',
    objective: msg('programming:bugHunter.levels.2'),
    challengeCount: 6,
    timing: seconds(75, 25),
    kinds: EARLY_KINDS,
    elementCount: 8,
    decisionCount: 1,
    visualNoise: 1,
    distractors: 2,
    violation: 'obvious',
    sequenceRules: ORDER_RULES,
    schemaFields: BASIC_SCHEMA,
    codeRules: NAMING_RULES,
  },
  3: {
    level: 3,
    tier: 'fundamentals',
    objective: msg('programming:bugHunter.levels.3'),
    challengeCount: 6,
    timing: seconds(90, 32),
    kinds: EARLY_KINDS,
    elementCount: 10,
    decisionCount: 1,
    visualNoise: 1,
    distractors: 3,
    violation: 'subtle',
    sequenceRules: ORDER_RULES,
    schemaFields: WIDER_SCHEMA,
    codeRules: NAMING_RULES,
  },
  4: {
    level: 4,
    tier: 'intermediate',
    objective: msg('programming:bugHunter.levels.4'),
    challengeCount: 8,
    timing: seconds(110, 42),
    kinds: EARLY_KINDS,
    elementCount: 14,
    decisionCount: 2,
    visualNoise: 1,
    distractors: 4,
    violation: 'subtle',
    sequenceRules: ALL_SEQUENCE_RULES,
    schemaFields: WIDER_SCHEMA,
    codeRules: ALL_CODE_RULES,
  },
  5: {
    level: 5,
    tier: 'intermediate',
    objective: msg('programming:bugHunter.levels.5'),
    challengeCount: 8,
    timing: seconds(130, 52),
    kinds: MIXED_KINDS,
    elementCount: 18,
    decisionCount: 2,
    visualNoise: 2,
    distractors: 6,
    violation: 'subtle',
    sequenceRules: ALL_SEQUENCE_RULES,
    schemaFields: FULL_SCHEMA,
    codeRules: ALL_CODE_RULES,
  },
  6: {
    level: 6,
    tier: 'intermediate',
    objective: msg('programming:bugHunter.levels.6'),
    challengeCount: 8,
    timing: seconds(150, 62),
    kinds: MIXED_KINDS,
    elementCount: 22,
    decisionCount: 2,
    visualNoise: 2,
    distractors: 8,
    violation: 'subtle',
    sequenceRules: ALL_SEQUENCE_RULES,
    schemaFields: FULL_SCHEMA,
    codeRules: ALL_CODE_RULES,
  },
  7: {
    level: 7,
    tier: 'advanced',
    objective: msg('programming:bugHunter.levels.7'),
    challengeCount: 8,
    timing: seconds(170, 75),
    kinds: LATE_KINDS,
    elementCount: 26,
    decisionCount: 3,
    visualNoise: 3,
    distractors: 10,
    violation: 'subtle',
    sequenceRules: ALL_SEQUENCE_RULES,
    schemaFields: FULL_SCHEMA,
    codeRules: ALL_CODE_RULES,
  },
  8: {
    level: 8,
    tier: 'advanced',
    objective: msg('programming:bugHunter.levels.8'),
    challengeCount: 8,
    timing: seconds(190, 85),
    kinds: LATE_KINDS,
    elementCount: 30,
    decisionCount: 3,
    visualNoise: 3,
    distractors: 12,
    violation: 'subtle',
    sequenceRules: ALL_SEQUENCE_RULES,
    schemaFields: FULL_SCHEMA,
    codeRules: ALL_CODE_RULES,
  },
  9: {
    level: 9,
    tier: 'expert',
    objective: msg('programming:bugHunter.levels.9'),
    challengeCount: 8,
    timing: seconds(220, 100),
    kinds: LATE_KINDS,
    elementCount: 36,
    decisionCount: 3,
    visualNoise: 4,
    distractors: 15,
    violation: 'subtle',
    sequenceRules: ALL_SEQUENCE_RULES,
    schemaFields: FULL_SCHEMA,
    codeRules: ALL_CODE_RULES,
  },
  10: {
    level: 10,
    tier: 'expert',
    objective: msg('programming:bugHunter.levels.10'),
    challengeCount: 8,
    timing: seconds(250, 115),
    kinds: LATE_KINDS,
    elementCount: 42,
    decisionCount: 3,
    visualNoise: 4,
    distractors: 20,
    violation: 'subtle',
    sequenceRules: ALL_SEQUENCE_RULES,
    schemaFields: FULL_SCHEMA,
    codeRules: ALL_CODE_RULES,
  },
};
