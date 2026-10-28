import { multiSelectResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { COLORS, type ColorName } from '@/games/kit/content';
import {
  NEAR_COLORS,
  canonicalMark,
  countWhere,
  indicesWhere,
  mark,
  poseWords,
  shapePlural,
  type Mark,
} from '../../shared/content';
import { INSPECTION_LEVELS } from './levels';
import type { InspectionChallenge, InspectionProfile, InspectionRule } from './types';

export const INSPECTION_ID = gameIdOf('complex-visual-inspection');

const samePose = (a: Mark, b: Mark) => {
  const ca = canonicalMark(a);
  const cb = canonicalMark(b);
  return ca.rotation === cb.rotation && ca.mirrored === cb.mirrored;
};

const ruleMark = (rule: InspectionRule, color: ColorName = rule.color) =>
  mark(rule.shape, color, rule.rotation, rule.mirrored);

export function isTarget(rule: InspectionRule, m: Mark): boolean {
  if (m.shape !== rule.shape || !samePose(m, ruleMark(rule, m.color))) return false;
  return rule.negated ? m.color !== rule.color : m.color === rule.color;
}

/** "blue triangles, turned right" · "L shapes, mirrored, upright, in any colour except red". */
export function ruleText(rule: InspectionRule): string {
  const pose = poseWords(ruleMark(rule));
  const posed = `${shapePlural(rule.shape)}, ${pose === '' ? 'upright' : pose}`;
  return rule.negated ? `${posed}, in any colour except ${rule.color}` : `${rule.color} ${posed}`;
}

function randomMark(
  random: RandomGenerator,
  profile: InspectionProfile,
  palette: readonly ColorName[],
): Mark {
  const shape = pick(random, profile.shapes);
  return mark(
    shape,
    pick(random, palette),
    pick(random, profile.rotations),
    shape === 'ell' && chance(random, 0.5),
  );
}

/** A non-target that matches the rule in every feature but one. */
function lure(
  random: RandomGenerator,
  profile: InspectionProfile,
  rule: InspectionRule,
  palette: readonly ColorName[],
  allowed: readonly ColorName[],
): Mark | null {
  const base = ruleMark(rule, rule.negated ? pick(random, allowed) : rule.color);
  switch (pick(random, ['shape', 'color', 'pose'] as const)) {
    case 'shape': {
      const others = profile.shapes.filter((s) => s !== rule.shape);
      return others.length === 0 ? null : { ...base, shape: pick(random, others), mirrored: false };
    }
    case 'color': {
      if (rule.negated) return { ...base, color: rule.color };
      const near = NEAR_COLORS[rule.color].filter((c) => palette.includes(c));
      const color =
        profile.nearColors && near.length > 0
          ? pick(random, near)
          : pick(
              random,
              palette.filter((c) => c !== rule.color),
            );
      return { ...base, color };
    }
    case 'pose':
      return rule.shape === 'ell' && chance(random, 0.5)
        ? { ...base, mirrored: !base.mirrored }
        : {
            ...base,
            rotation: pick(
              random,
              profile.rotations.filter((r) => r !== rule.rotation),
            ),
          };
  }
}

export const complexVisualInspectionGame: GameDefinition<InspectionChallenge, InspectionProfile> = {
  id: INSPECTION_ID,
  name: 'Complex Visual Inspection',
  tagline: 'Three features must all match.',
  description:
    'Inspect a dense grid and mark every item that matches a rule on three features at once — shape, colour and direction (later also mirroring and “any colour except…”). Most distractors break just one feature.',
  area: 'attention',
  skills: [
    'selective-attention',
    'concentration',
    'visual-orientation',
    'instruction-comprehension',
  ],
  meta: {
    category: 'attention',
    audiences: ['teens', 'adults', 'seniors'],
    interaction: 'grid',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'A grid counts as correct when your marks match the targets (missed targets and wrong marks are errors); from level 8 one error is tolerated. Your result is the share of grids solved; answering is not timed.',
    feedback: 'explain',
    accessibilityNotes:
      'Rules name a colour, so playing visually needs colour vision; every item is also named with colour, shape and pose ("green L shape, mirrored, turned left") for screen readers. Direction is judged on the drawn shape, which takes careful looking.',
  },
  instructions: [
    'Read the rule: a shape, a direction and a colour must ALL match.',
    'Most items break only one part of the rule — check each feature.',
    '“Mirrored” means flipped left-to-right; “turned right” means a quarter turn clockwise.',
    'Mark every match, then press Check. From level 7 you decide how many there are.',
  ],
  simpleInstructions: 'Tap the shapes that match the rule in every way.',
  levels: INSPECTION_LEVELS,
  generate({ identity, profile, random }) {
    const cells = profile.columns * profile.rows;
    const { items, rule } = retryGeneration('an inspection grid', () => {
      const palette = sample(random, COLORS, profile.colors);
      const shape = pick(random, profile.shapes);
      const r: InspectionRule = {
        shape,
        rotation: pick(random, profile.rotations),
        mirrored: shape === 'ell' && chance(random, 0.5),
        color: pick(random, palette),
        negated: profile.negated,
      };
      const allowed = palette.filter((c) => c !== r.color);
      const spots = new Set(
        sample(
          random,
          Array.from({ length: cells }, (_, i) => i),
          profile.targets,
        ),
      );
      const grid: Mark[] = [];
      for (let i = 0; i < cells; i++) {
        if (spots.has(i)) {
          grid.push(ruleMark(r, r.negated ? pick(random, allowed) : r.color));
          continue;
        }
        let m = chance(random, profile.lureShare)
          ? lure(random, profile, r, palette, allowed)
          : null;
        for (let tries = 0; m === null || isTarget(r, m); tries++) {
          if (tries > 20) return null;
          m = randomMark(random, profile, palette);
        }
        grid.push(m);
      }
      if (countWhere(grid, (m) => isTarget(r, m)) !== profile.targets) return null;
      return { items: grid, rule: r };
    });
    const solution = indicesWhere(items, (m) => isTarget(rule, m));
    const text = ruleText(rule);
    return {
      ...identity,
      prompt: profile.exact
        ? `Mark all ${solution.length}: ${text}.`
        : `Mark every match: ${text}. You decide how many.${profile.maxErrors > 0 ? ' One slip is allowed.' : ''}`,
      content: {
        kind: rule.negated ? 'negated' : 'positive',
        columns: profile.columns,
        items,
        rule,
      },
      response: multiSelectResponse(cells, solution, {
        exact: profile.exact,
        maxErrors: profile.maxErrors,
      }),
      explanation: `${solution.length} items matched all features (${text}). The rest differed in shape, colour or direction.`,
      skills: ['selective-attention', 'visual-orientation'],
      timing: profile.timing,
    };
  },
};
