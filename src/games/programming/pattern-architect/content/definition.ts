import type { GameDefinition } from '@/domain/game';
import type { RandomGenerator } from '@/domain/random';
import { weightedPick } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import type { PatternDraft } from './generators/draft';
import { symbolGrid } from './generators/grids';
import { numberSequence } from './generators/sequences';
import { structureMatch } from './generators/structures';
import { transformInference } from './generators/transforms';
import { treeAnalogy } from './generators/trees';
import { PATTERN_LEVELS } from './levels';
import type { PatternChallenge, PatternKind, PatternProfile } from './types';

const GENERATORS: Record<
  PatternKind,
  (random: RandomGenerator, profile: PatternProfile) => PatternDraft
> = {
  'number-sequence': numberSequence,
  'symbol-grid': symbolGrid,
  'transform-inference': transformInference,
  'structure-match': structureMatch,
  'tree-analogy': treeAnalogy,
};

export const PATTERN_GAME_ID = gameIdOf('pattern-architect');

export const patternArchitectGame: GameDefinition<PatternChallenge, PatternProfile> = {
  id: PATTERN_GAME_ID,
  name: 'Pattern Architect',
  tagline: 'Find the rule, then apply it.',
  description:
    'Continue number sequences, complete symbol grids, infer hidden programs from examples and recognise the same structure under different names. Trains pattern recognition, abstraction and generalisation.',
  area: 'patterns',
  skills: ['pattern-recognition', 'abstraction', 'algorithmic-thinking', 'decomposition'],
  meta: {
    category: 'programming',
    audiences: ['programmers', 'adults', 'teens'],
    interaction: 'choice',
    estimatedMinutes: 6,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time', 'streak'],
    scoringSummary:
      'Points for each rule found and applied, scaled by level, with pace and streak bonuses. Accuracy is 75% of the performance index.',
    feedback: 'explain',
  },
  instructions: [
    'Every challenge hides one rule. Find a rule that explains everything shown, then apply it.',
    'Grids: shapes and counts can follow different rules — check rows and columns separately.',
    'Hidden programs chain a few simple steps from the listed vocabulary; the order of the steps matters.',
    'Trees are written as a(b, c): a contains b and c, in that order. Graphs match when renaming the nodes makes every arrow line up.',
  ],
  levels: PATTERN_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
