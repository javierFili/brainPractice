import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import {
  applyTransform,
  gridKey,
  ROTATIONS,
  trim,
  type Draft,
  type Transform,
} from '../../shared/content';
import { SHAPE_ROTATION_LEVELS } from './levels';
import { nearPiece, pieceSignature, randomPiece, toGrid } from './polyomino';
import type { ShapeRotationChallenge, ShapeRotationProfile } from './types';

export const SHAPE_ROTATION_ID = gameIdOf('shape-rotation');

const TURNS: readonly Transform[] = ['cw', '180', 'ccw'];
const MIRRORS: readonly Transform[] = ['flip-lr', 'flip-ud', 'diag', 'anti'];

export const TURN_WORDS: Partial<Record<Transform, string>> = {
  cw: 'a quarter turn clockwise',
  '180': 'a half turn',
  ccw: 'a quarter turn anticlockwise',
};

type Grid = number[][];

/**
 * `count` asymmetric pieces of distinct shapes (no two match even after turning or flipping).
 */
function distinctPieces(
  random: RandomGenerator,
  profile: ShapeRotationProfile,
  count: number,
): Grid[] | null {
  const base = randomPiece(random, profile.cells);
  const pieces: Grid[] = [];
  const classes = new Set<string>();
  for (let attempt = 0; attempt < 40 && pieces.length < count; attempt++) {
    const cells = profile.near ? nearPiece(random, base) : randomPiece(random, profile.cells);
    if (cells === null) continue;
    const { kind, asymmetric } = pieceSignature(cells);
    if (classes.has(kind) || !asymmetric) continue;
    classes.add(kind);
    pieces.push(toGrid(cells));
  }
  return pieces.length === count ? pieces : null;
}

const label = (grid: Grid) => gridKey(trim(grid));

function draft(random: RandomGenerator, profile: ShapeRotationProfile) {
  return retryGeneration('shape rotation', (): Draft<ShapeRotationChallenge> | null => {
    const mirrors = profile.pairs > 0;
    const count = mirrors ? profile.pairs : profile.others + 1;
    // Every piece looks different from its mirror image, so any of them can be the reference.
    const pieces = distinctPieces(random, profile, count);
    if (pieces === null) return null;
    // The reference is drawn at random among the pieces, so no piece is "the central one".
    const refIndex = randomInt(random, 0, pieces.length - 1);
    const piece = pieces[refIndex] as Grid;
    const turnUsed = pick(random, TURNS);
    const answer = label(applyTransform(piece, turnUsed));
    const wrong: string[] = [];
    pieces.forEach((p, i) => {
      if (i !== refIndex) wrong.push(label(applyTransform(p, pick(random, ROTATIONS))));
      if (mirrors) wrong.push(label(applyTransform(p, pick(random, MIRRORS))));
    });
    const turnText = TURN_WORDS[turnUsed] ?? '';
    return {
      prompt: 'Which option is the same piece, only turned (not flipped over)?',
      content: { kind: mirrors ? 'mirrors' : 'pieces', piece: trim(piece) },
      response: singleChoice(random, answer, shuffle(random, wrong)),
      explanation: mirrors
        ? `The answer is the piece turned ${turnText}. Each look-alike is a mirror image: to match it you would have to flip the piece over, and turning alone never does that. The remaining options are different pieces.`
        : `The answer is the piece turned ${turnText}. The other options are different pieces: no turn makes them match.`,
      skills: ['spatial-reasoning', 'visual-orientation'],
    };
  });
}

export const shapeRotationGame: GameDefinition<ShapeRotationChallenge, ShapeRotationProfile> = {
  id: SHAPE_ROTATION_ID,
  name: 'Shape Rotation',
  tagline: 'Turn it in your head.',
  description:
    'A piece made of squares is shown. Find the option that is the same piece turned around. From level 2 every piece also appears as its mirror image, which looks very similar but can only be made by flipping the piece over.',
  area: 'patterns',
  skills: ['spatial-reasoning', 'visual-orientation'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Each piece counts as correct when you choose the turned copy. Your result is the share of pieces matched correctly; there is no time limit.',
    feedback: 'explain',
    accessibilityNotes:
      'Pieces are read aloud row by row (which columns are filled), which is much harder to turn mentally than the picture.',
  },
  instructions: [
    'Look at the piece. Imagine turning it on the table, like a puzzle piece.',
    'Choose the option that is the same piece, turned. Flipping it over is not allowed.',
    'Mirror images look almost the same: check where the odd square sticks out.',
    'Keys 1 to 8 pick an option.',
  ],
  simpleInstructions: 'Find the same shape, just turned around.',
  levels: SHAPE_ROTATION_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
