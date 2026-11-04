import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg, type Message } from '@/domain/shared';
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

const T = 'patterns:shapeRotation';

/** "a quarter turn clockwise"… in the reader's language. */
export const TURN_WORDS: Partial<Record<Transform, Message>> = {
  cw: msg(`${T}.turn.cw`),
  '180': msg(`${T}.turn.180`),
  ccw: msg(`${T}.turn.ccw`),
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
      prompt: msg(`${T}.prompt`),
      content: { kind: mirrors ? 'mirrors' : 'pieces', piece: trim(piece) },
      response: singleChoice(random, answer, shuffle(random, wrong)),
      explanation: msg(`${T}.explanation.${mirrors ? 'mirrors' : 'pieces'}`, { turn: turnText }),
      skills: ['spatial-reasoning', 'visual-orientation'],
    };
  });
}

export const shapeRotationGame: GameDefinition<ShapeRotationChallenge, ShapeRotationProfile> = {
  id: SHAPE_ROTATION_ID,
  name: msg('patterns:shapeRotation.name'),
  tagline: msg('patterns:shapeRotation.tagline'),
  description: msg('patterns:shapeRotation.description'),
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
    scoringSummary: msg('patterns:shapeRotation.scoringSummary'),
    feedback: 'explain',
    accessibilityNotes: msg('patterns:shapeRotation.accessibilityNotes'),
  },
  instructions: [
    msg('patterns:shapeRotation.instructions.1'),
    msg('patterns:shapeRotation.instructions.2'),
    msg('patterns:shapeRotation.instructions.3'),
    msg('patterns:shapeRotation.instructions.4'),
  ],
  simpleInstructions: msg('patterns:shapeRotation.simpleInstructions'),
  levels: SHAPE_ROTATION_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
