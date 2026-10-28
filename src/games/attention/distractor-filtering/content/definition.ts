import { multiSelectResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import {
  NEAR_COLORS,
  NEAR_SHAPES,
  countWhere,
  indicesWhere,
  mark,
  type Mark,
} from '../../shared/content';
import { DISTRACTOR_FILTERING_LEVELS } from './levels';
import type {
  DistractorFilteringChallenge,
  DistractorFilteringContent,
  DistractorFilteringProfile,
  FilterKind,
} from './types';

export const DISTRACTOR_FILTERING_ID = gameIdOf('distractor-filtering');

type Target = DistractorFilteringContent['target'];

/** Whether an item is a target under the rule (the single source of truth for the solution). */
export function isTarget(kind: FilterKind, target: Target, item: Mark): boolean {
  if (kind === 'shape') return item.shape === target.shape;
  if (kind === 'color') return item.color === target.color;
  return item.shape === target.shape && item.color === target.color;
}

export function targetPhrase(kind: FilterKind, target: Target): string {
  if (kind === 'shape') return `${target.shape}s (any colour)`;
  if (kind === 'color') return `${target.color} shapes (any shape)`;
  return `${target.color} ${target.shape}s`;
}

const otherShape = (random: RandomGenerator, shape: ShapeKind, near: boolean) =>
  near && chance(random, 0.7)
    ? pick(random, NEAR_SHAPES[shape])
    : pick(
        random,
        SHAPES.filter((s) => s !== shape),
      );
const otherColor = (random: RandomGenerator, color: ColorName, near: boolean) =>
  near && chance(random, 0.7)
    ? pick(random, NEAR_COLORS[color])
    : pick(
        random,
        COLORS.filter((c) => c !== color),
      );

/** A non-target; `lure` makes it share the feature that is not decisive (or one of the two). */
function distractor(
  random: RandomGenerator,
  profile: DistractorFilteringProfile,
  target: Target,
  lure: boolean,
): Mark {
  const { shape, color } = target;
  switch (profile.kind) {
    case 'shape':
      return mark(otherShape(random, shape, profile.near), lure ? color : pick(random, COLORS));
    case 'color':
      return mark(lure ? shape : pick(random, SHAPES), otherColor(random, color, profile.near));
    case 'conjunction':
      if (!lure) return mark(otherShape(random, shape, false), otherColor(random, color, false));
      return chance(random, 0.5)
        ? mark(shape, otherColor(random, color, profile.near))
        : mark(otherShape(random, shape, profile.near), color);
  }
}

export const distractorFilteringGame: GameDefinition<
  DistractorFilteringChallenge,
  DistractorFilteringProfile
> = {
  id: DISTRACTOR_FILTERING_ID,
  name: 'Distractor Filtering',
  tagline: 'Only the blue triangles. Ignore the rest.',
  description:
    'Mark every item that matches a rule such as “blue triangles”, while look-alikes share the colour or the shape. Distractors get closer to the target and, at higher levels, you decide yourself when you have found them all.',
  area: 'attention',
  skills: ['selective-attention', 'concentration', 'instruction-comprehension'],
  meta: {
    category: 'attention',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'A grid counts as correct when your marks match the targets: missed targets and wrong marks are errors. From level 8 one error is tolerated. Your result is the share of grids solved; answering is not timed.',
    feedback: 'brief',
    accessibilityNotes:
      'Rules that name a colour need colour vision to play visually; every item is also named ("purple triangle"), so a screen reader can filter by name. Shapes always differ in outline too.',
  },
  instructions: [
    'Read the rule above the grid: it names a shape, a colour, or both.',
    'Mark every item that matches the rule exactly, then press Check.',
    'Look-alikes share only part of the rule: a blue heart is not a blue triangle.',
    'From level 7 the count is not given; from level 8 one slip is allowed.',
  ],
  simpleInstructions: 'Tap all the shapes that match the rule, and only those.',
  levels: DISTRACTOR_FILTERING_LEVELS,
  generate({ identity, profile, random }) {
    const count = profile.columns * profile.rows;
    const { items, target } = retryGeneration('a filtering grid', () => {
      const t: Target = { shape: pick(random, SHAPES), color: pick(random, COLORS) };
      const spots = new Set(
        sample(
          random,
          Array.from({ length: count }, (_, i) => i),
          profile.targets,
        ),
      );
      const grid = Array.from({ length: count }, (_, i) =>
        spots.has(i)
          ? mark(t.shape, profile.kind === 'shape' ? pick(random, COLORS) : t.color, 0, false)
          : distractor(random, profile, t, chance(random, profile.similarity)),
      );
      // Rebuild shape/colour of shape- or colour-rule targets so they vary but still match.
      const fixed = grid.map((m, i) =>
        spots.has(i) && profile.kind === 'color' ? mark(pick(random, SHAPES), t.color) : m,
      );
      if (countWhere(fixed, (m) => isTarget(profile.kind, t, m)) !== profile.targets) return null;
      if (profile.kind === 'conjunction' && profile.similarity >= 0.5) {
        const sameShape = countWhere(fixed, (m) => m.shape === t.shape && m.color !== t.color);
        const sameColor = countWhere(fixed, (m) => m.color === t.color && m.shape !== t.shape);
        if (sameShape < 2 || sameColor < 2) return null;
      }
      return { items: fixed, target: t };
    });
    const solution = indicesWhere(items, (m) => isTarget(profile.kind, target, m));
    const phrase = targetPhrase(profile.kind, target);
    const slack = profile.maxErrors > 0 ? ` One slip is allowed.` : '';
    return {
      ...identity,
      prompt: profile.exact
        ? `Mark all ${solution.length} ${phrase}.`
        : `Mark every one of the ${phrase} — you decide how many there are.${slack}`,
      content: { kind: profile.kind, columns: profile.columns, items, target },
      response: multiSelectResponse(count, solution, {
        exact: profile.exact,
        maxErrors: profile.maxErrors,
      }),
      explanation: `There ${solution.length === 1 ? 'was' : 'were'} ${solution.length} ${phrase}.`,
      skills:
        profile.kind === 'conjunction'
          ? ['selective-attention', 'concentration']
          : ['selective-attention', 'instruction-comprehension'],
      timing: profile.timing,
    };
  },
};
