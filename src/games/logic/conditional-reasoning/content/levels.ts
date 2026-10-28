import { defineLevels, untimed } from '@/games/kit/content';
import type { ConditionalProfile } from './types';

const ALL_PATTERNS = [
  'affirm-antecedent',
  'deny-consequent',
  'affirm-consequent',
  'deny-antecedent',
] as const;

const base = { negatedParts: false, chainLength: 1, atoms: 2 };

/**
 * Valid steps first (the rule applies; the result is false so the cause is false), then the two
 * classic traps, "not" inside rules, chains, "unless", "only if" and finally mixed rule sets with
 * "or" over four sentences.
 */
export const CONDITIONAL_LEVELS = defineLevels<ConditionalProfile>([
  {
    objective: 'One rule, and its “if” part is true.',
    challengeCount: 5,
    timing: untimed(20_000),
    ...base,
    structures: { basic: 1 },
    patterns: ['affirm-antecedent'],
    verdicts: ['true', 'false'],
  },
  {
    objective: 'Work backwards: the result did not happen.',
    challengeCount: 5,
    timing: untimed(25_000),
    ...base,
    structures: { basic: 1 },
    patterns: ['affirm-antecedent', 'deny-consequent'],
    verdicts: ['true', 'false'],
  },
  {
    objective: 'Spot the traps where you can’t tell.',
    challengeCount: 6,
    timing: untimed(30_000),
    ...base,
    structures: { basic: 1 },
    patterns: ALL_PATTERNS,
    verdicts: ['true', 'false', 'unknown'],
  },
  {
    objective: 'Rules with “not” inside them.',
    challengeCount: 6,
    timing: untimed(35_000),
    ...base,
    negatedParts: true,
    structures: { basic: 1 },
    patterns: ALL_PATTERNS,
    verdicts: ['true', 'false', 'unknown'],
  },
  {
    objective: 'Chains: two rules in a row.',
    challengeCount: 6,
    timing: untimed(40_000),
    ...base,
    chainLength: 2,
    structures: { chain: 1 },
    patterns: ALL_PATTERNS,
    verdicts: ['true', 'false', 'unknown'],
  },
  {
    objective: 'Longer chains, with “not”.',
    challengeCount: 6,
    timing: untimed(45_000),
    ...base,
    negatedParts: true,
    chainLength: 3,
    structures: { chain: 1 },
    patterns: ALL_PATTERNS,
    verdicts: ['true', 'false', 'unknown'],
  },
  {
    objective: 'Rules that say “unless”.',
    challengeCount: 6,
    timing: untimed(45_000),
    ...base,
    negatedParts: true,
    chainLength: 3,
    structures: { unless: 2, chain: 1 },
    patterns: ALL_PATTERNS,
    verdicts: ['true', 'false', 'unknown'],
  },
  {
    objective: 'Rules that say “only if”.',
    challengeCount: 6,
    timing: untimed(50_000),
    ...base,
    negatedParts: true,
    chainLength: 3,
    structures: { 'only-if': 2, unless: 1, chain: 1 },
    patterns: ALL_PATTERNS,
    verdicts: ['true', 'false', 'unknown'],
  },
  {
    objective: 'Mixed rules, including “either … or”.',
    challengeCount: 6,
    timing: untimed(60_000),
    negatedParts: true,
    chainLength: 3,
    atoms: 3,
    structures: { mixed: 2, 'only-if': 1 },
    patterns: ALL_PATTERNS,
    verdicts: ['true', 'false', 'unknown'],
  },
  {
    objective: 'Several mixed rules about four things.',
    challengeCount: 6,
    timing: untimed(75_000),
    negatedParts: true,
    chainLength: 4,
    atoms: 4,
    structures: { mixed: 1 },
    patterns: ALL_PATTERNS,
    verdicts: ['true', 'false', 'unknown'],
  },
]);
