import type { GameDefinition } from '@/domain/game';
import type { RandomGenerator } from '@/domain/random';
import { weightedPick } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
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
  name: msg('programming:patternArchitect.name'),
  tagline: msg('programming:patternArchitect.tagline'),
  description: msg('programming:patternArchitect.description'),
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
    scoringSummary: msg('programming:patternArchitect.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('programming:patternArchitect.instructions.rule'),
    msg('programming:patternArchitect.instructions.grids'),
    msg('programming:patternArchitect.instructions.programs'),
    msg('programming:patternArchitect.instructions.trees'),
  ],
  levels: PATTERN_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
