import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { weightedPick } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { rowTexts } from './format';
import { GENERATORS, withSingleError } from './generators';
import { ERROR_DETECTION_LEVELS } from './levels';
import type { ErrorDetectionChallenge, ErrorDetectionProfile } from './types';

export const ERROR_DETECTION_ID = gameIdOf('error-detection');

export const errorDetectionGame: GameDefinition<ErrorDetectionChallenge, ErrorDetectionProfile> = {
  id: ERROR_DETECTION_ID,
  name: 'Error Detection',
  tagline: 'Proofread: exactly one thing is wrong.',
  description:
    'Proofread everyday lists — a sorted list, a shopping receipt, a day schedule, a word list, copied codes — and point at the single row that is wrong. Errors get smaller and lists longer.',
  area: 'attention',
  skills: ['error-detection', 'concentration', 'sustained-attention'],
  meta: {
    category: 'attention',
    audiences: ['teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'A list counts as correct when you point at the one wrong row. Your result is the share of lists solved; answering is not timed.',
    feedback: 'explain',
    accessibilityNotes:
      'Receipts and schedules need simple arithmetic (multiplying small quantities, adding prices, subtracting times). Word lists use common English words.',
  },
  instructions: [
    'Read the rule above the list: it says what every row must satisfy.',
    'Check the rows one by one. Exactly one row breaks the rule.',
    'Press that row (or move with the arrow keys and press Enter).',
    'From level 7 errors are small: 10 cents, 5 minutes, an 0 instead of an O.',
  ],
  simpleInstructions: 'One line in the list is wrong. Find it and tap it.',
  levels: ERROR_DETECTION_LEVELS,
  generate({ identity, profile, random }) {
    const draft = retryGeneration('a list with exactly one error', () =>
      withSingleError(GENERATORS[weightedPick(random, profile.kinds)](random, profile)),
    );
    return {
      ...identity,
      prompt: 'Which row is wrong?',
      content: draft.content,
      response: locateResponse(rowTexts(draft.content).length, draft.index),
      explanation: draft.explanation,
      skills:
        draft.content.kind === 'receipt' || draft.content.kind === 'schedule'
          ? ['error-detection', 'concentration']
          : ['error-detection', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
