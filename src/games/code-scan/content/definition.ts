import type { GameDefinition } from '@/domain/game';
import { weightedPick } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { classifyTheChange, findTheChange, sameOrDifferent } from './generators/challenges';
import type { CodeScanDraft } from './generators/draft';
import { CODE_SCAN_LEVELS } from './levels';
import type { CodeScanKind, CodeScanProfile, SpeedChallenge } from './types';

const GENERATORS: Record<
  CodeScanKind,
  (...args: Parameters<typeof findTheChange>) => CodeScanDraft
> = {
  'same-or-different': sameOrDifferent,
  'find-the-change': findTheChange,
  'classify-the-change': classifyTheChange,
};

export const CODE_SCAN_GAME_ID = gameIdOf('code-scan');

export const codeScanGame: GameDefinition<SpeedChallenge, CodeScanProfile> = {
  id: CODE_SCAN_GAME_ID,
  name: 'Code Scan',
  tagline: 'Spot the one token that changed.',
  description:
    'Compare an original pseudocode snippet with its copy and spot the single changed token — an operator, a swapped variable, an off-by-one number, a misspelled name or a negated condition. Trains processing speed, rapid comparison and fast error detection.',
  area: 'speed',
  skills: ['attention', 'debugging', 'pattern-recognition'],
  instructions: [
    'The original is on the left (or on top), the copy on the right (or below).',
    'When the snippets differ, exactly one token of one line changed; everything else is identical.',
    'To point at a changed line, click it (or focus it with Tab and press Enter) in the copy.',
    'Change kinds: operator (< → <=, + → -, and → or), variable swapped for another one in the snippet, number changed, name misspelled, or “not” added to a condition.',
    'Speed counts more than in other games — but a wrong answer costs points, so stay precise.',
  ],
  levels: CODE_SCAN_LEVELS,
  // Speed is the trained ability: double the default speed bonus and give pace 40% of the index.
  scoring: { maxSpeedBonus: 1, accuracyWeight: 0.6 },
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
