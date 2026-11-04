import { multiSelectResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import { SHAPES } from '@/games/kit/content';
import {
  ROTATIONS,
  TURNING_SHAPES,
  cellName,
  changeMark,
  indicesWhere,
  listWords,
  mark,
  markKey,
  markLabel,
  randomColor,
  sameLook,
  type Mark,
} from '../../shared/content';
import { VISUAL_DIFFERENCE_LEVELS } from './levels';
import type { VisualDifferenceChallenge, VisualDifferenceProfile } from './types';

export const VISUAL_DIFFERENCE_ID = gameIdOf('visual-difference');

/** `size` marks with distinct looks; oriented palettes use pointing shapes in random poses. */
function palette(random: RandomGenerator, size: number, oriented: boolean): Mark[] {
  const marks = new Map<string, Mark>();
  while (marks.size < size) {
    const m = oriented
      ? mark(
          pick(random, TURNING_SHAPES),
          randomColor(random),
          pick(random, ROTATIONS),
          random.next() < 0.5,
        )
      : mark(pick(random, SHAPES), randomColor(random));
    marks.set(markKey(m), m);
  }
  return [...marks.values()];
}

/** Indices where the two pictures look different. */
export const differingCells = (left: readonly Mark[], right: readonly Mark[]) =>
  indicesWhere(left, (m, i) => !sameLook(m, right[i] as Mark));

export const visualDifferenceGame: GameDefinition<
  VisualDifferenceChallenge,
  VisualDifferenceProfile
> = {
  id: VISUAL_DIFFERENCE_ID,
  name: msg('attention:visualDifference.name'),
  tagline: msg('attention:visualDifference.tagline'),
  description: msg('attention:visualDifference.description'),
  area: 'attention',
  skills: ['selective-attention', 'concentration', 'error-detection', 'visual-orientation'],
  meta: {
    category: 'attention',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('attention:visualDifference.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('attention:visualDifference.accessibilityNotes'),
  },
  instructions: [
    msg('attention:visualDifference.instructions.1'),
    msg('attention:visualDifference.instructions.2'),
    msg('attention:visualDifference.instructions.3'),
    msg('attention:visualDifference.instructions.4'),
  ],
  simpleInstructions: msg('attention:visualDifference.simpleInstructions'),
  levels: VISUAL_DIFFERENCE_LEVELS,
  generate({ identity, profile, random }) {
    const count = profile.columns * profile.columns;
    const oriented = profile.changes.includes('turn') || profile.changes.includes('mirror');
    const { left, right, changed } = retryGeneration('two pictures', () => {
      const marks = palette(random, profile.palette, oriented);
      const leftPicture = Array.from({ length: count }, () => pick(random, marks));
      const rightPicture = [...leftPicture];
      const spots = sample(
        random,
        Array.from({ length: count }, (_, i) => i),
        profile.differences,
      );
      for (const spot of spots) {
        const original = leftPicture[spot] as Mark;
        const changes = shuffle(random, profile.changes);
        const next = changes
          .map((change) => changeMark(random, original, change, profile.subtle))
          .find((m): m is Mark => m !== null);
        if (next === undefined) return null;
        rightPicture[spot] = next;
      }
      const found = differingCells(leftPicture, rightPicture);
      if (found.length !== profile.differences) return null;
      return { left: leftPicture, right: rightPicture, changed: found };
    });
    return {
      ...identity,
      prompt: msg('attention:visualDifference.prompt', { count: profile.differences }),
      content: { kind: oriented ? 'oriented' : 'plain', columns: profile.columns, left, right },
      response: multiSelectResponse(count, changed),
      explanation: msg('attention:visualDifference.explanation', {
        differences: listWords(
          changed.map((i) =>
            msg('attention:visualDifference.difference', {
              cell: cellName(i, profile.columns),
              before: markLabel(left[i] as Mark),
              after: markLabel(right[i] as Mark),
            }),
          ),
        ),
      }),
      skills: oriented
        ? ['selective-attention', 'visual-orientation']
        : ['selective-attention', 'error-detection'],
      timing: profile.timing,
    };
  },
};
