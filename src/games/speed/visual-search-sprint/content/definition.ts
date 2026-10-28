import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, shuffle, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import {
  COLORS,
  SHAPES,
  glyphLabel,
  sameGlyph,
  type Glyph,
  type ShapeKind,
} from '@/games/kit/content';
import { SPEED_SCORING } from '@/games/speed/shared/content';
import { VISUAL_SEARCH_LEVELS } from './levels';
import type { SearchKind, VisualSearchChallenge, VisualSearchProfile } from './types';

/** Shape pairs with similar outlines that remain clearly distinct at tile size. */
export const LOOK_ALIKES: readonly (readonly [ShapeKind, ShapeKind])[] = [
  ['circle', 'hexagon'],
  ['square', 'diamond'],
  ['star', 'cross'],
  ['triangle', 'diamond'],
  ['heart', 'circle'],
];

const otherShape = (random: RandomGenerator, shape: ShapeKind) =>
  pick(
    random,
    SHAPES.filter((s) => s !== shape),
  );

const lookAlikeOf = (random: RandomGenerator, shape: ShapeKind): ShapeKind | null => {
  const partners = LOOK_ALIKES.flatMap(([a, b]) => (a === shape ? [b] : b === shape ? [a] : []));
  return partners.length === 0 ? null : pick(random, partners);
};

/** Distractors for one challenge (setSize − 1 of them). Null when the candidate is unusable. */
function distractorsFor(
  random: RandomGenerator,
  kind: SearchKind,
  target: Glyph,
  count: number,
  lookAlike: boolean,
): Glyph[] | null {
  if (kind !== 'conjunction') {
    const shape =
      kind === 'similar' ? lookAlikeOf(random, target.shape) : otherShape(random, target.shape);
    if (shape === null) return null;
    return Array.from({ length: count }, () => ({ shape, color: target.color }));
  }
  const shape = lookAlike ? lookAlikeOf(random, target.shape) : otherShape(random, target.shape);
  if (shape === null) return null;
  const color = pick(
    random,
    COLORS.filter((c) => c !== target.color),
  );
  // Roughly half of each type, never fewer than two of either, so neither feature alone works.
  const sameShape = randomInt(
    random,
    Math.max(2, Math.floor(count * 0.4)),
    Math.min(count - 2, Math.ceil(count * 0.6)),
  );
  return Array.from({ length: count }, (_, i) =>
    i < sameShape ? { shape: target.shape, color } : { shape, color: target.color },
  );
}

export const VISUAL_SEARCH_SPRINT_ID = gameIdOf('visual-search-sprint');

export const visualSearchSprintGame: GameDefinition<VisualSearchChallenge, VisualSearchProfile> = {
  id: VISUAL_SEARCH_SPRINT_ID,
  name: 'Visual Search Sprint',
  tagline: 'One target, many distractors — find it fast.',
  description:
    'A grid of shapes hides exactly one target. At first it differs by shape and pops out; later every distractor shares its colour or its shape, so you have to check the combination. Grids grow from 9 to 36 cells.',
  area: 'speed',
  skills: ['selective-attention', 'processing-speed', 'concentration'],
  meta: {
    category: 'speed',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 2,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time'],
    scoringSummary:
      'A trial is correct when you press the target cell. Correct answers earn more points the faster they are; a wrong cell costs points and running out of time scores nothing. Accuracy and average response time are reported separately; relaxed timing removes the limit.',
    feedback: 'brief',
    accessibilityNotes:
      'Levels 1–4 can be solved by shape alone. Conjunction levels (5–10) need colour discrimination: half the distractors have the target’s shape in another colour. Every cell’s accessible name gives its row, column, colour and shape, so screen-reader users can search by name (which is a different, slower task).',
  },
  instructions: [
    'The target is shown above the grid and named in the question.',
    'Press the one cell that shows exactly that shape in that colour.',
    'From level 5 the other cells share either its colour or its shape — check both.',
    'Keyboard: Tab into the grid, move with the arrow keys, press Enter.',
  ],
  simpleInstructions: 'Find the shape that matches the one at the top and press it.',
  levels: VISUAL_SEARCH_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    return retryGeneration('a visual search grid', () => {
      const target: Glyph = { shape: pick(random, SHAPES), color: pick(random, COLORS) };
      const distractors = distractorsFor(
        random,
        kind,
        target,
        profile.setSize - 1,
        profile.lookAlikeConjunction,
      );
      if (distractors === null) return null;
      const index = randomInt(random, 0, profile.setSize - 1);
      const cells = shuffle(random, distractors);
      cells.splice(index, 0, target);
      if (cells.filter((g) => sameGlyph(g, target)).length !== 1) return null;
      const label = glyphLabel(target);
      return {
        ...identity,
        prompt: `Find the ${label}.`,
        content: { kind, target, cells, columns: profile.columns },
        response: locateResponse(cells.length, index),
        explanation: `The ${label} was at row ${Math.floor(index / profile.columns) + 1}, column ${(index % profile.columns) + 1}.`,
        skills:
          kind === 'conjunction'
            ? ['selective-attention', 'concentration', 'processing-speed']
            : ['selective-attention', 'processing-speed'],
        timing: profile.timing,
      };
    });
  },
};
