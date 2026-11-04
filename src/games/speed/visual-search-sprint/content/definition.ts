import { locateResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, shuffle, weightedPick, type RandomGenerator } from '@/domain/random';
import { gameIdOf, msg } from '@/domain/shared';
import {
  COLORS,
  SHAPES,
  cellLabelAt,
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
  name: msg('speed:visualSearchSprint.name'),
  tagline: msg('speed:visualSearchSprint.tagline'),
  description: msg('speed:visualSearchSprint.description'),
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
    scoringSummary: msg('speed:visualSearchSprint.scoringSummary'),
    feedback: 'brief',
    accessibilityNotes: msg('speed:visualSearchSprint.accessibilityNotes'),
  },
  instructions: [
    msg('speed:visualSearchSprint.instructions.target'),
    msg('speed:visualSearchSprint.instructions.press'),
    msg('speed:visualSearchSprint.instructions.conjunction'),
    msg('speed:visualSearchSprint.instructions.keyboard'),
  ],
  simpleInstructions: msg('speed:visualSearchSprint.simpleInstructions'),
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
        prompt: msg('speed:visualSearchSprint.prompt', { target: label }),
        content: { kind, target, cells, columns: profile.columns },
        response: locateResponse(cells.length, index),
        explanation: msg('speed:visualSearchSprint.explanation', {
          target: label,
          cell: cellLabelAt(index, profile.columns),
        }),
        skills:
          kind === 'conjunction'
            ? ['selective-attention', 'concentration', 'processing-speed']
            : ['selective-attention', 'processing-speed'],
        timing: profile.timing,
      };
    });
  },
};
