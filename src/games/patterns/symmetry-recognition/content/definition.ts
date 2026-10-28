import { multiSelectResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import {
  at,
  cellName,
  flipLR,
  flipUD,
  listWords,
  makeGrid,
  orderedChoice,
  sameGrid,
  type Draft,
  type TileGrid,
} from '../../shared/content';
import { SYMMETRY_LEVELS } from './levels';
import type { Axis, SymmetryChallenge, SymmetryClass, SymmetryProfile } from './types';

export const SYMMETRY_ID = gameIdOf('symmetry-recognition');

export const CLASS_LABELS: Record<SymmetryClass, string> = {
  'left-right': 'Vertical mirror line: left matches right',
  'top-bottom': 'Horizontal mirror line: top matches bottom',
  both: 'Both mirror lines',
  none: 'No mirror line',
};

/** The exact symmetry of a grid. */
export function classifyGrid(grid: TileGrid): SymmetryClass {
  const lr = sameGrid(grid, flipLR(grid));
  const tb = sameGrid(grid, flipUD(grid));
  return lr && tb ? 'both' : lr ? 'left-right' : tb ? 'top-bottom' : 'none';
}

const DENSITY = 0.45;

const randomValue = (random: RandomGenerator, tiles: number) =>
  chance(random, DENSITY) ? randomInt(random, 1, tiles) : 0;

/** A grid with (at least) the requested mirror lines, filled at random. */
function symmetricGrid(
  random: RandomGenerator,
  rows: number,
  cols: number,
  tiles: number,
  target: SymmetryClass,
): number[][] {
  const free = makeGrid(rows, cols, () => randomValue(random, tiles));
  const lr = target === 'left-right' || target === 'both';
  const tb = target === 'top-bottom' || target === 'both';
  return makeGrid(rows, cols, (r, c) =>
    at(free, tb ? Math.min(r, rows - 1 - r) : r, lr ? Math.min(c, cols - 1 - c) : c),
  );
}

/** Pairs of mirror cells that do not match, for the explanation. */
function mismatches(grid: TileGrid, axis: Axis): string[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const out: string[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const [mr, mc] = axis === 'vertical' ? [r, cols - 1 - c] : [rows - 1 - r, c];
      if ((axis === 'vertical' ? c < mc : r < mr) && at(grid, r, c) !== at(grid, mr, mc))
        out.push(`${cellName(r, c)} and ${cellName(mr, mc)}`);
    }
  return out;
}

const filledShare = (grid: TileGrid) =>
  grid.flat().filter((v) => v > 0).length / grid.flat().length;

function classifyDraft(
  random: RandomGenerator,
  profile: SymmetryProfile,
): Draft<SymmetryChallenge> | null {
  const { rows, cols, tiles, classes, breaks } = profile;
  const target = pick(random, classes);
  let grid: number[][];
  if (target !== 'none') grid = symmetricGrid(random, rows, cols, tiles, target);
  else if (breaks === 0) grid = makeGrid(rows, cols, () => randomValue(random, tiles));
  else {
    grid = symmetricGrid(
      random,
      rows,
      cols,
      tiles,
      pick(random, ['left-right', 'top-bottom', 'both']),
    );
    for (let i = 0; i < breaks; i++) {
      const r = randomInt(random, 0, rows - 1);
      const c = randomInt(random, 0, cols - 1);
      const row = grid[r] as number[];
      const old = row[c] as number;
      const choices = Array.from({ length: tiles + 1 }, (_, v) => v).filter((v) => v !== old);
      row[c] = pick(random, choices);
    }
  }
  const share = filledShare(grid);
  if (share < 0.25 || share > 0.7 || classifyGrid(grid) !== target) return null;
  const lrMiss = mismatches(grid, 'vertical');
  const tbMiss = mismatches(grid, 'horizontal');
  const why = (miss: string[], line: string) =>
    miss.length === 0
      ? `Folding along the ${line} line, every cell lands on a matching cell.`
      : `Folding along the ${line} line does not work: ${listWords(miss.slice(0, 2).map((m) => m))}${miss.length > 2 ? ' (and more)' : ''} do not match.`;
  return {
    prompt: 'Which mirror lines does this pattern have?',
    content: { kind: 'classify', grid },
    response: orderedChoice(
      classes.map((c) => CLASS_LABELS[c]),
      classes.indexOf(target),
    ),
    explanation: `${CLASS_LABELS[target]}. ${why(lrMiss, 'vertical')} ${
      classes.includes('top-bottom') ? why(tbMiss, 'horizontal') : ''
    }`.trim(),
    skills: ['spatial-reasoning', 'pattern-recognition'],
  };
}

/** Size of the half the player fills, and the solution indices (row-major in that half). */
export function mirrorTargets(given: TileGrid, axis: Axis) {
  const rows = given.length;
  const cols = given[0]?.length ?? 0;
  const half = makeGrid(rows, cols, (r, c) =>
    axis === 'vertical' ? at(given, r, cols - 1 - c) : at(given, rows - 1 - r, c),
  );
  const targets = half.flat().flatMap((v, i) => (v > 0 ? [i] : []));
  return { rows, cols, targets };
}

/** Name of a cell of the half to fill, in whole-grid coordinates. */
export function fillCellName(given: TileGrid, axis: Axis, index: number) {
  const rows = given.length;
  const cols = given[0]?.length ?? 0;
  const r = Math.floor(index / cols);
  const c = index % cols;
  return axis === 'vertical' ? cellName(r, c + cols) : cellName(r + rows, c);
}

function completeDraft(
  random: RandomGenerator,
  profile: SymmetryProfile,
): Draft<SymmetryChallenge> | null {
  const axis = pick(random, profile.axes);
  const rows = axis === 'vertical' ? profile.rows : profile.rows / 2;
  const cols = axis === 'vertical' ? profile.cols / 2 : profile.cols;
  const given = makeGrid(rows, cols, () => (chance(random, DENSITY) ? 1 : 0));
  // A half that is its own mirror image would let "copy it across" pass for "mirror it".
  const selfMirror = axis === 'vertical' ? flipLR(given) : flipUD(given);
  if (sameGrid(given, selfMirror)) return null;
  const { targets } = mirrorTargets(given, axis);
  if (targets.length < 2 || targets.length > rows * cols - 2) return null;
  const side = axis === 'vertical' ? 'right' : 'bottom';
  return {
    prompt:
      axis === 'vertical'
        ? 'Mark the cells on the right so the picture mirrors the left half.'
        : 'Mark the cells at the bottom so the picture mirrors the top half.',
    content: { kind: 'complete', axis, given },
    response: multiSelectResponse(rows * cols, targets, { exact: profile.announceCount }),
    explanation: `Each cell on the ${side} copies the cell the same distance away on the other side of the line. The ${side} half needs: ${listWords(targets.map((i) => fillCellName(given, axis, i)))}.`,
    skills: ['spatial-reasoning', 'visual-orientation'],
  };
}

export const symmetryGame: GameDefinition<SymmetryChallenge, SymmetryProfile> = {
  id: SYMMETRY_ID,
  name: 'Symmetry Recognition',
  tagline: 'Fold it in your head.',
  description:
    'Decide whether a pattern has a mirror line — down the middle, across the middle, both or none — and draw the missing mirror half of a picture. Higher levels use coloured tiles, patterns that are only almost symmetric and halves with no count given.',
  area: 'patterns',
  skills: ['spatial-reasoning', 'pattern-recognition', 'visual-orientation'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'A pattern counts as correct when you name its exact mirror lines, or when every cell you mark (and no other) completes the mirror half. Your result is the share of correct patterns; there is no time limit.',
    feedback: 'explain',
    accessibilityNotes:
      'Patterns are read aloud row by row; checking a mirror line by ear means comparing rows or columns from both ends.',
  },
  instructions: [
    'A mirror line splits a pattern into two halves that match like a reflection, as if you folded the paper.',
    'Spotting: choose which mirror lines the pattern has. Check every cell, a single one can break it. Tiles must match in shape and colour.',
    'Drawing: mark the cells of the empty half so it mirrors the given half, then press Check.',
    'Keyboard: keys 1–4 pick an answer; arrow keys move between cells and Enter marks a cell.',
  ],
  simpleInstructions: 'Fold the picture in your head: do both halves match?',
  levels: SYMMETRY_LEVELS,
  generate({ identity, profile, random }) {
    const draft = retryGeneration('symmetry pattern', () =>
      profile.kind === 'classify' ? classifyDraft(random, profile) : completeDraft(random, profile),
    );
    return { ...identity, ...draft, timing: profile.timing };
  },
};
