import type { ResponseOf } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg, textId, type Message, type Text } from '@/domain/shared';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import {
  NEAR_COLORS,
  NEAR_SHAPES,
  countWhere,
  mark,
  shapeCount,
  shapePlural,
  type Mark,
} from '../../shared/content';
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

/** "even numbers", "numbers above 50". */
export const numberWords = (rules: Rules): Message =>
  msg(`attention:dualTask.numbers.${rules.numberRule}`, { threshold: rules.threshold });

/** "stars", "blue stars". */
export const shapeWords = (rules: Rules): Message => shapePlural(rules.shape, rules.color);

const numberCount = (rules: Rules, count: number): Message =>
  msg(`attention:dualTask.numberCount.${rules.numberRule}`, {
    count,
    threshold: rules.threshold,
  });

/** "3 even numbers · 2 stars". */
export const optionLabel = (rules: Rules, numbers: number, shapes: number): Text =>
  joinText([numberCount(rules, numbers), shapeCount(rules.shape, shapes, rules.color)], ' · ');

/** Like `singleChoice` (same shuffle, same ids), for translatable labels. */
function choiceOf(
  random: RandomGenerator,
  correct: Text,
  distractors: readonly Text[],
): ResponseOf<'single-choice'> {
  const options = shuffle(random, [correct, ...distractors]).map((label, i) => ({
    id: String.fromCharCode(97 + i),
    label,
  }));
  const solution = options.find((option) => textId(option.label) === textId(correct));
  return {
    format: 'single-choice',
    question: { options },
    solution: { optionId: solution?.id ?? 'a' },
  };
}

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
  name: msg('attention:dualTask.name'),
  tagline: msg('attention:dualTask.tagline'),
  description: msg('attention:dualTask.description'),
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
    scoringSummary: msg('attention:dualTask.scoringSummary'),
    feedback: 'explain',
    accessibilityNotes: msg('attention:dualTask.accessibilityNotes'),
  },
  instructions: [
    msg('attention:dualTask.instructions.1'),
    msg('attention:dualTask.instructions.2'),
    msg('attention:dualTask.instructions.3'),
    msg('attention:dualTask.instructions.4'),
  ],
  simpleInstructions: msg('attention:dualTask.simpleInstructions'),
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
      prompt: msg('attention:dualTask.prompt'),
      studyPrompt: msg('attention:dualTask.studyPrompt', {
        numbers: numberWords(rules),
        shapes: shapeWords(rules),
      }),
      content: {
        kind: profile.numberRule === 'above' ? 'threshold' : 'parity',
        items,
        itemMs: profile.itemMs,
        ...rules,
      },
      response: choiceOf(
        random,
        correct,
        combos.filter((c) => textId(c) !== textId(correct)),
      ),
      explanation: msg('attention:dualTask.explanation', {
        numbers: numberCount(rules, numbers),
        shapes: shapeCount(rules.shape, shapes, rules.color),
      }),
      skills: ['concentration', 'sustained-attention'],
      timing: profile.timing,
    };
  },
};
