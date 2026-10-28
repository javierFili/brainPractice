import { multiSelectResponse } from '@/domain/challenge';
import type { GameDefinition } from '@/domain/game';
import { sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
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
  name: 'Object Recall',
  tagline: 'Which of these did you see?',
  description:
    'Look at a small set of everyday objects. Then a bigger board mixes them with new ones: mark the objects you saw. At higher levels the new objects belong to the same families as the studied ones.',
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
    scoringSummary:
      'A board counts as correct when every object you mark is one you studied. Your result is the share of boards recognised exactly; answering is not timed.',
    feedback: 'brief',
  },
  instructions: [
    'Look at the objects. Press “I’m ready” when you have them.',
    'A bigger board appears with the same objects and some new ones.',
    'Mark exactly the objects you saw (the counter shows how many), then press Check.',
    'Keyboard: arrow keys move between objects, Enter marks or unmarks one.',
  ],
  simpleInstructions: 'Look at the pictures, then find them again among new ones.',
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
      prompt: `Mark the ${profile.studied} objects you saw.`,
      studyPrompt: `Remember these ${profile.studied} objects.`,
      content: { kind: profile.kind, studied, board, columns: profile.columns },
      response: multiSelectResponse(board.length, targets),
      explanation: `You saw: ${studied.map((id) => objectById(id).name).join(', ')}.`,
      skills: profile.kind === 'mixed' ? ['visual-memory'] : ['visual-memory', 'error-detection'],
      timing: profile.timing,
    };
  },
};
