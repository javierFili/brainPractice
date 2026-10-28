import { defineLevels, untimed } from '@/games/kit/content';
import type { GlyphFamily, NumberFamily, RuleProfile } from './types';

const BASIC_GLYPH: GlyphFamily[] = ['color', 'shape'];
const NEG_GLYPH: GlyphFamily[] = [...BASIC_GLYPH, 'not-color', 'not-shape'];
const ALL_GLYPH: GlyphFamily[] = [...NEG_GLYPH, 'color-or-shape'];
const SIMPLE_NUM: NumberFamily[] = ['parity', 'multiple', 'greater', 'less'];
const ALL_NUM: NumberFamily[] = [...SIMPLE_NUM, 'ends-in', 'and'];
const none = { hidden: [], considered: [] };

/**
 * One-feature rules first (colour, then shape), then number properties, negations, “or” rules,
 * and finally “and” rules with fewer examples to compare. Each level checks the examples against
 * every rule family it considers, so harder levels need sharper examples.
 */
export const RULE_DISCOVERY_LEVELS = defineLevels<RuleProfile>([
  {
    objective: 'The rule is about colour.',
    challengeCount: 5,
    timing: untimed(20_000),
    glyph: { hidden: ['color'], considered: BASIC_GLYPH },
    number: none,
    numberShare: 0,
    examples: 4,
    options: 3,
  },
  {
    objective: 'Colour or shape: which one matters?',
    challengeCount: 5,
    timing: untimed(25_000),
    glyph: { hidden: BASIC_GLYPH, considered: BASIC_GLYPH },
    number: none,
    numberShare: 0,
    examples: 4,
    options: 4,
  },
  {
    objective: 'Rules about numbers: even, odd, big or small.',
    challengeCount: 5,
    timing: untimed(30_000),
    glyph: none,
    number: { hidden: ['parity', 'greater', 'less'], considered: SIMPLE_NUM },
    numberShare: 1,
    examples: 4,
    options: 4,
  },
  {
    objective: 'Rules that say what something is not.',
    challengeCount: 5,
    timing: untimed(35_000),
    glyph: { hidden: ['not-color', 'not-shape'], considered: NEG_GLYPH },
    number: none,
    numberShare: 0,
    examples: 4,
    options: 4,
  },
  {
    objective: 'Times tables and ranges.',
    challengeCount: 5,
    timing: untimed(40_000),
    glyph: none,
    number: { hidden: SIMPLE_NUM, considered: [...SIMPLE_NUM, 'ends-in'] },
    numberShare: 1,
    examples: 4,
    options: 4,
  },
  {
    objective: '“Or” rules: one of two features is enough.',
    challengeCount: 5,
    timing: untimed(45_000),
    glyph: { hidden: ['color-or-shape'], considered: ALL_GLYPH },
    number: none,
    numberShare: 0,
    examples: 5,
    options: 4,
  },
  {
    objective: 'Shapes and numbers, every simple rule.',
    challengeCount: 5,
    timing: untimed(45_000),
    glyph: { hidden: NEG_GLYPH, considered: ALL_GLYPH },
    number: { hidden: ['multiple', 'ends-in'], considered: [...SIMPLE_NUM, 'ends-in'] },
    numberShare: 0.5,
    examples: 4,
    options: 4,
  },
  {
    objective: '“And” rules: two things must both be true.',
    challengeCount: 5,
    timing: untimed(55_000),
    glyph: none,
    number: { hidden: ['and'], considered: ALL_NUM },
    numberShare: 1,
    examples: 5,
    options: 4,
  },
  {
    objective: 'Any shape rule, fewer examples.',
    challengeCount: 5,
    timing: untimed(55_000),
    glyph: { hidden: ALL_GLYPH, considered: ALL_GLYPH },
    number: { hidden: ['and', 'multiple'], considered: ALL_NUM },
    numberShare: 0.4,
    examples: 4,
    options: 5,
  },
  {
    objective: 'Any rule, more options to check.',
    challengeCount: 6,
    timing: untimed(60_000),
    glyph: { hidden: ['color-or-shape', 'not-shape', 'not-color'], considered: ALL_GLYPH },
    number: { hidden: ['and', 'ends-in'], considered: ALL_NUM },
    numberShare: 0.5,
    examples: 4,
    options: 5,
  },
]);
