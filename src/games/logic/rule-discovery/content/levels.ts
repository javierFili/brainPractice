import { msg } from '@/domain/shared';
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
    objective: msg('logic:ruleDiscovery.levels.1'),
    challengeCount: 5,
    timing: untimed(20_000),
    glyph: { hidden: ['color'], considered: BASIC_GLYPH },
    number: none,
    numberShare: 0,
    examples: 4,
    options: 3,
  },
  {
    objective: msg('logic:ruleDiscovery.levels.2'),
    challengeCount: 5,
    timing: untimed(25_000),
    glyph: { hidden: BASIC_GLYPH, considered: BASIC_GLYPH },
    number: none,
    numberShare: 0,
    examples: 4,
    options: 4,
  },
  {
    objective: msg('logic:ruleDiscovery.levels.3'),
    challengeCount: 5,
    timing: untimed(30_000),
    glyph: none,
    number: { hidden: ['parity', 'greater', 'less'], considered: SIMPLE_NUM },
    numberShare: 1,
    examples: 4,
    options: 4,
  },
  {
    objective: msg('logic:ruleDiscovery.levels.4'),
    challengeCount: 5,
    timing: untimed(35_000),
    glyph: { hidden: ['not-color', 'not-shape'], considered: NEG_GLYPH },
    number: none,
    numberShare: 0,
    examples: 4,
    options: 4,
  },
  {
    objective: msg('logic:ruleDiscovery.levels.5'),
    challengeCount: 5,
    timing: untimed(40_000),
    glyph: none,
    number: { hidden: SIMPLE_NUM, considered: [...SIMPLE_NUM, 'ends-in'] },
    numberShare: 1,
    examples: 4,
    options: 4,
  },
  {
    objective: msg('logic:ruleDiscovery.levels.6'),
    challengeCount: 5,
    timing: untimed(45_000),
    glyph: { hidden: ['color-or-shape'], considered: ALL_GLYPH },
    number: none,
    numberShare: 0,
    examples: 5,
    options: 4,
  },
  {
    objective: msg('logic:ruleDiscovery.levels.7'),
    challengeCount: 5,
    timing: untimed(45_000),
    glyph: { hidden: NEG_GLYPH, considered: ALL_GLYPH },
    number: { hidden: ['multiple', 'ends-in'], considered: [...SIMPLE_NUM, 'ends-in'] },
    numberShare: 0.5,
    examples: 4,
    options: 4,
  },
  {
    objective: msg('logic:ruleDiscovery.levels.8'),
    challengeCount: 5,
    timing: untimed(55_000),
    glyph: none,
    number: { hidden: ['and'], considered: ALL_NUM },
    numberShare: 1,
    examples: 5,
    options: 4,
  },
  {
    objective: msg('logic:ruleDiscovery.levels.9'),
    challengeCount: 5,
    timing: untimed(55_000),
    glyph: { hidden: ALL_GLYPH, considered: ALL_GLYPH },
    number: { hidden: ['and', 'multiple'], considered: ALL_NUM },
    numberShare: 0.4,
    examples: 4,
    options: 5,
  },
  {
    objective: msg('logic:ruleDiscovery.levels.10'),
    challengeCount: 6,
    timing: untimed(60_000),
    glyph: { hidden: ['color-or-shape', 'not-shape', 'not-color'], considered: ALL_GLYPH },
    number: { hidden: ['and', 'ends-in'], considered: ALL_NUM },
    numberShare: 0.5,
    examples: 4,
    options: 5,
  },
]);
