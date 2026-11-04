import type { GameDefinition } from '@/domain/game';
import { weightedPick } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
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
  name: msg('programming:codeScan.name'),
  tagline: msg('programming:codeScan.tagline'),
  description: msg('programming:codeScan.description'),
  area: 'speed',
  skills: ['attention', 'debugging', 'pattern-recognition'],
  meta: {
    category: 'programming',
    audiences: ['programmers', 'adults', 'teens'],
    interaction: 'mixed',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: false,
    measures: ['accuracy', 'response-time', 'streak'],
    scoringSummary: msg('programming:codeScan.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('programming:codeScan.instructions.layout'),
    msg('programming:codeScan.instructions.oneToken'),
    msg('programming:codeScan.instructions.point'),
    msg('programming:codeScan.instructions.kinds'),
    msg('programming:codeScan.instructions.speed'),
  ],
  levels: CODE_SCAN_LEVELS,
  // Speed is the trained ability: double the default speed bonus and give pace 40% of the index.
  scoring: { maxSpeedBonus: 1, accuracyWeight: 0.6 },
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return { ...identity, ...GENERATORS[kind](random, profile), timing: profile.timing };
  },
};
