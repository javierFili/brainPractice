import { multiSelectResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
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
  name: 'Visual Difference',
  tagline: 'Spot the differences, one cell at a time.',
  description:
    'Two pictures made of shapes look the same, but a few cells of the right one differ. Mark every difference on the right picture. The counter tells you how many there are.',
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
    scoringSummary:
      'A pair of pictures counts as correct when every marked cell is a real difference. Your result is the share of pairs solved exactly; answering is not timed.',
    feedback: 'brief',
    accessibilityNotes:
      'Some differences are colour only (from level 6, nearby colours such as red and orange). Every cell is named with its colour, shape and pose, so screen readers can compare the two pictures cell by cell.',
  },
  instructions: [
    'Compare the two pictures cell by cell (the right one is below on small screens).',
    'Mark each cell of the right picture that differs, then press Check.',
    'A difference is a change of colour, shape, which way it points, or a mirrored L.',
    'The counter shows how many differences to find.',
  ],
  simpleInstructions: 'Find what is different in the second picture and tap it.',
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
      prompt: `Mark the ${profile.differences} ${profile.differences === 1 ? 'cell' : 'cells'} of the right picture that differ.`,
      content: { kind: oriented ? 'oriented' : 'plain', columns: profile.columns, left, right },
      response: multiSelectResponse(count, changed),
      explanation: `Differences: ${listWords(
        changed.map(
          (i) =>
            `${cellName(i, profile.columns)} (${markLabel(left[i] as Mark)} → ${markLabel(right[i] as Mark)})`,
        ),
      )}.`,
      skills: oriented
        ? ['selective-attention', 'visual-orientation']
        : ['selective-attention', 'error-detection'],
      timing: profile.timing,
    };
  },
};
