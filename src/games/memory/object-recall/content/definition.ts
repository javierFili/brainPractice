import { multiSelectResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg } from '@/domain/shared';
import { OBJECT_CATEGORIES, OBJECTS, objectsOf, type EverydayObject } from '@/games/kit/content';
import { objectById } from '../../shared/content';
import { OBJECT_RECALL_LEVELS } from './levels';
import type { ObjectRecallChallenge, ObjectRecallProfile } from './types';

/** Objects the board is drawn from: everything, or every object of a few random families. */
function poolFor(random: RandomGenerator, profile: ObjectRecallProfile): readonly EverydayObject[] {
  if (profile.kind === 'mixed') return OBJECTS;
  return sample(random, OBJECT_CATEGORIES, profile.families).flatMap(objectsOf);
}

export const OBJECT_RECALL_ID = gameIdOf('object-recall');

export const objectRecallGame: GameDefinition<ObjectRecallChallenge, ObjectRecallProfile> = {
  id: OBJECT_RECALL_ID,
  name: msg('memory:objectRecall.name'),
  tagline: msg('memory:objectRecall.tagline'),
  description: msg('memory:objectRecall.description'),
  area: 'memory',
  skills: ['visual-memory', 'short-term-memory', 'error-detection'],
  meta: {
    category: 'memory',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('memory:objectRecall.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('memory:objectRecall.instructions.look'),
    msg('memory:objectRecall.instructions.board'),
    msg('memory:objectRecall.instructions.mark'),
    msg('memory:objectRecall.instructions.keyboard'),
  ],
  simpleInstructions: msg('memory:objectRecall.simpleInstructions'),
  levels: OBJECT_RECALL_LEVELS,
  generate({ identity, profile, random }) {
    const pool = poolFor(random, profile);
    const chosen = sample(random, pool, profile.board);
    const studied = chosen.slice(0, profile.studied).map((o) => o.id);
    const board = shuffle(
      random,
      chosen.map((o) => o.id),
    );
    const targets = board.flatMap((id, i) => (studied.includes(id) ? [i] : []));
    return {
      ...identity,
      prompt: msg('memory:objectRecall.prompt', { count: profile.studied }),
      studyPrompt: msg('memory:objectRecall.studyPrompt', { count: profile.studied }),
      content: { kind: profile.kind, studied, board, columns: profile.columns },
      response: multiSelectResponse(board.length, targets),
      explanation: msg('memory:objectRecall.explanation', {
        objects: joinText(
          studied.map((id) => objectById(id).label),
          ', ',
        ),
      }),
      skills: profile.kind === 'mixed' ? ['visual-memory'] : ['visual-memory', 'error-detection'],
      timing: profile.timing,
    };
  },
};
