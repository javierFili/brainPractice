import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import { NEAR_COLORS, NEAR_SHAPES, countWhere, mark, type Mark } from '../../shared/content';
import { DUAL_TASK_LEVELS } from './levels';
import type { DualItem, DualTaskChallenge, DualTaskContent, DualTaskProfile } from './types';

export const DUAL_TASK_ID = gameIdOf('dual-task-attention');

type Rules = Pick<DualTaskContent, 'numberRule' | 'threshold' | 'shape' | 'color'>;

export const numberCounts = (rules: Rules, n: number) =>
  rules.numberRule === 'even'
    ? n % 2 === 0
    : rules.numberRule === 'odd'
      ? n % 2 === 1
      : n > rules.threshold;

export const shapeCounts = (rules: Rules, m: Mark) =>
  m.shape === rules.shape && (rules.color === null || m.color === rules.color);

export function numberWords(rules: Rules): string {
  return rules.numberRule === 'above'
    ? `numbers above ${rules.threshold}`
    : `${rules.numberRule} numbers`;
}

export const shapeWords = (rules: Rules) =>
  `${rules.color === null ? '' : `${rules.color} `}${rules.shape}s`;

export const optionLabel = (rules: Rules, numbers: number, shapes: number) =>
  `${numbers} ${numberWords(rules)} · ${shapes} ${shapeWords(rules)}`;

/** Two candidate values for a count, the true one randomly the lower or the higher. */
function pairAround(random: RandomGenerator, value: number, spacing: number): [number, number] {
  const lower = value - spacing >= 0 && chance(random, 0.5);
  return lower ? [value - spacing, value] : [value, value + spacing];
}

function otherMark(
  random: RandomGenerator,
  profile: DualTaskProfile,
  shape: ShapeKind,
  color: ColorName | null,
): Mark {
  if (profile.lookalikes && chance(random, 0.5)) {
    // Same shape in another colour (if colour matters), or a close outline.
    if (color !== null && chance(random, 0.5)) return mark(shape, pick(random, NEAR_COLORS[color]));
    return mark(pick(random, NEAR_SHAPES[shape]), color ?? pick(random, COLORS));
  }
  return mark(
    pick(
      random,
      SHAPES.filter((s) => s !== shape),
    ),
    pick(random, COLORS),
  );
}

export const dualTaskGame: GameDefinition<DualTaskChallenge, DualTaskProfile> = {
  id: DUAL_TASK_ID,
  name: 'Dual-Task Attention',
  tagline: 'Two counts at once.',
  description:
    'Pairs of a number and a shape appear one at a time. Keep two running counts — for example even numbers and stars — then pick the option with both counts right.',
  area: 'attention',
  skills: ['concentration', 'sustained-attention', 'cognitive-flexibility', 'short-term-memory'],
  meta: {
    category: 'attention',
    audiences: ['teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'A stream counts as correct when the chosen option has both counts right. Each count has two candidate values, so getting only one count right leaves a 50% guess. Answering is not timed.',
    feedback: 'explain',
    accessibilityNotes:
      'From level 6 the shape count names a colour. Each pair is announced to screen readers ("7, blue star"); the pace (0.9–1.6 s per pair) doubles in relaxed mode.',
  },
  instructions: [
    'Read both rules before the stream starts: one about numbers, one about shapes.',
    'Pairs appear one at a time. Keep two counts in your head.',
    'A pair can count for both rules, for one, or for neither.',
    'At the end, choose the option where both counts are right (keys 1–4).',
  ],
  simpleInstructions: 'Count two things at once, then pick the right pair of numbers.',
  levels: DUAL_TASK_LEVELS,
  generate({ identity, profile, random }) {
    const threshold = profile.twoDigits ? 50 : 5;
    const [low, high] = profile.twoDigits ? [10, 99] : [1, 9];
    const draft = retryGeneration('a dual-task stream', () => {
      const shape = pick(random, SHAPES);
      const color = profile.shapeColor ? pick(random, COLORS) : null;
      const rules: Rules = { numberRule: profile.numberRule, threshold, shape, color };
      const items: DualItem[] = Array.from({ length: profile.length }, () => ({
        number: randomInt(random, low, high),
        mark: chance(random, 0.35)
          ? mark(shape, color ?? pick(random, COLORS))
          : otherMark(random, profile, shape, color),
      }));
      if (items.some((item, i) => i > 0 && item.number === items[i - 1]?.number)) return null;
      const numbers = countWhere(items, (item) => numberCounts(rules, item.number));
      const shapes = countWhere(items, (item) => shapeCounts(rules, item.mark));
      if (numbers < 2 || numbers > profile.length - 2 || shapes < 1) return null;
      return { rules, items, numbers, shapes };
    });
    const { rules, items, numbers, shapes } = draft;
    const numberPair = pairAround(random, numbers, profile.spacing);
    const shapePair = pairAround(random, shapes, profile.spacing);
    const combos = numberPair.flatMap((n) => shapePair.map((s) => optionLabel(rules, n, s)));
    const correct = optionLabel(rules, numbers, shapes);
    return {
      ...identity,
      prompt: 'Which option has both counts right?',
      studyPrompt: `Count the ${numberWords(rules)} AND the ${shapeWords(rules)}.`,
      content: {
        kind: profile.numberRule === 'above' ? 'threshold' : 'parity',
        items,
        itemMs: profile.itemMs,
        ...rules,
      },
      response: singleChoice(
        random,
        correct,
        combos.filter((c) => c !== correct),
      ),
      explanation: `There were ${numbers} ${numberWords(rules)} and ${shapes} ${shapeWords(rules)}.`,
      skills: ['concentration', 'sustained-attention'],
      timing: profile.timing,
    };
  },
};
