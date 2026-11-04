import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { weightedPick } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { rowTexts } from './format';
import { GENERATORS, withSingleError } from './generators';
import { ERROR_DETECTION_LEVELS } from './levels';
import type { ErrorDetectionChallenge, ErrorDetectionProfile } from './types';

export const ERROR_DETECTION_ID = gameIdOf('error-detection');

export const errorDetectionGame: GameDefinition<ErrorDetectionChallenge, ErrorDetectionProfile> = {
  id: ERROR_DETECTION_ID,
  name: msg('attention:errorDetection.name'),
  tagline: msg('attention:errorDetection.tagline'),
  description: msg('attention:errorDetection.description'),
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
    scoringSummary: msg('attention:errorDetection.scoringSummary'),
    feedback: 'explain',
    accessibilityNotes: msg('attention:errorDetection.accessibilityNotes'),
  },
  instructions: [
    msg('attention:errorDetection.instructions.1'),
    msg('attention:errorDetection.instructions.2'),
    msg('attention:errorDetection.instructions.3'),
    msg('attention:errorDetection.instructions.4'),
  ],
  simpleInstructions: msg('attention:errorDetection.simpleInstructions'),
  levels: ERROR_DETECTION_LEVELS,
  generate({ identity, profile, random }) {
    const draft = retryGeneration('a list with exactly one error', () =>
      withSingleError(GENERATORS[weightedPick(random, profile.kinds)](random, profile)),
    );
    return {
      ...identity,
      prompt: msg('attention:errorDetection.prompt'),
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
