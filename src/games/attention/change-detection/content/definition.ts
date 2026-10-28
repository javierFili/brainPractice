import type { ResponseOf } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, sample, type RandomGenerator } from '@/domain/random';
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
  markLabel,
  randomColor,
  sameLook,
  type Mark,
} from '../../shared/content';
import { CHANGE_DETECTION_LEVELS } from './levels';
import type { ChangeDetectionChallenge, ChangeDetectionProfile, SceneChange } from './types';

export const CHANGE_DETECTION_ID = gameIdOf('change-detection');

export const YES = 'yes';
export const NO = 'no';

/** Yes/no in a fixed order (1 = yes, 2 = no); the answer is a fair coin, so order gives nothing away. */
const yesNo = (changed: boolean): ResponseOf<'single-choice'> => ({
  format: 'single-choice',
  question: {
    options: [
      { id: YES, label: 'Yes, something changed' },
      { id: NO, label: 'No, it is the same' },
    ],
  },
  solution: { optionId: changed ? YES : NO },
});

type Cell = Mark | null;

const sameCell = (a: Cell, b: Cell) => (a === null || b === null ? a === b : sameLook(a, b));

/** Cells that look different between the two scenes. */
export const changedCells = (before: readonly Cell[], after: readonly Cell[]) =>
  indicesWhere(before, (cell, i) => !sameCell(cell, after[i] ?? null));

function randomItem(random: RandomGenerator, oriented: boolean): Mark {
  return oriented
    ? mark(
        pick(
          random,
          TURNING_SHAPES.filter((s) => s !== 'ell'),
        ),
        randomColor(random),
        pick(random, ROTATIONS),
      )
    : mark(pick(random, SHAPES), randomColor(random));
}

/** Applies one change of type `change`; null when impossible on this scene. */
function applyChange(
  random: RandomGenerator,
  scene: readonly Cell[],
  change: SceneChange,
  subtle: boolean,
  oriented: boolean,
): Cell[] | null {
  const next = [...scene];
  const filled = indicesWhere(scene, (c) => c !== null);
  const empty = indicesWhere(scene, (c) => c === null);
  const spot = pick(random, filled);
  const item = scene[spot] as Mark;
  switch (change) {
    case 'appear':
      if (chance(random, 0.5) || empty.length === 0) next[spot] = null;
      else next[pick(random, empty)] = randomItem(random, oriented);
      return next;
    case 'move':
      if (empty.length === 0) return null;
      next[spot] = null;
      next[pick(random, empty)] = item;
      return next;
    case 'color':
    case 'shape':
    case 'turn': {
      const changed = changeMark(random, item, change, subtle);
      if (changed === null) return null;
      next[spot] = changed;
      return next;
    }
  }
}

const describeCell = (cell: Cell) => (cell === null ? 'empty' : markLabel(cell));

export const changeDetectionGame: GameDefinition<ChangeDetectionChallenge, ChangeDetectionProfile> =
  {
    id: CHANGE_DETECTION_ID,
    name: 'Change Detection',
    tagline: 'Same scene… or not?',
    description:
      'Look at a small scene of shapes. It disappears for a moment and comes back. Did anything change? About half the time nothing did. Changes become finer and scenes busier as you go.',
    area: 'attention',
    skills: ['selective-attention', 'visual-memory', 'concentration'],
    meta: {
      category: 'attention',
      audiences: ['kids', 'teens', 'adults', 'seniors'],
      interaction: 'choice',
      estimatedMinutes: 3,
      keyboard: 'full',
      relaxedFriendly: true,
      measures: ['accuracy'],
      scoringSummary:
        'Each trial counts as correct when you answer yes for a changed scene or no for an unchanged one; about half are unchanged, so guessing scores near 50%. Answering is not timed.',
      feedback: 'brief',
      accessibilityNotes:
        'Some changes are colour only (from level 6, to a nearby colour). The scene is a list of named cells, so a screen reader can compare the two looks, but the first look is time-limited (doubled in relaxed mode).',
    },
    instructions: [
      'Look at the whole scene while it is shown (press “I’m ready” to move on early).',
      'After a short blank, the scene comes back.',
      'Answer yes if anything changed (colour, shape, direction, position, an item appearing or vanishing), no if it is identical.',
      'Keys: 1 = yes, 2 = no. About half the scenes do not change.',
    ],
    simpleInstructions: 'Look, wait, look again: did anything change?',
    levels: CHANGE_DETECTION_LEVELS,
    generate({ identity, profile, random }) {
      const count = profile.columns * profile.rows;
      const oriented = profile.changes.includes('turn');
      const changed = chance(random, 0.5);
      const { before, after, kind } = retryGeneration('a change-detection scene', () => {
        const spots = new Set(
          sample(
            random,
            Array.from({ length: count }, (_, i) => i),
            profile.items,
          ),
        );
        const scene: Cell[] = Array.from({ length: count }, (_, i) =>
          spots.has(i) ? randomItem(random, oriented) : null,
        );
        if (!changed) return { before: scene, after: scene, kind: 'none' as const };
        const change = pick(random, profile.changes);
        const next = applyChange(random, scene, change, profile.subtle, oriented);
        if (next === null || changedCells(scene, next).length === 0) return null;
        return { before: scene, after: next, kind: change };
      });
      const diff = changedCells(before, after);
      return {
        ...identity,
        prompt: 'Did anything change?',
        studyPrompt: 'Look at the scene — it will disappear for a moment.',
        content: { kind, columns: profile.columns, before, after, gapMs: profile.gapMs },
        response: yesNo(changed),
        explanation: changed
          ? `Yes: ${listWords(diff.map((i) => `${cellName(i, profile.columns)} went from ${describeCell(before[i] ?? null)} to ${describeCell(after[i] ?? null)}`))}.`
          : 'No: the second look was identical to the first.',
        skills: ['selective-attention', 'visual-memory'],
        timing: profile.timing,
      };
    },
  };
