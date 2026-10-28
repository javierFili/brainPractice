import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import {
  balancedDesign,
  figure,
  figureLabel,
  minimalPeriod,
  nextCandidates,
  turn,
  type Draft,
  type Figure,
  type FigureShape,
  type Rotation,
} from '../../shared/content';
import { VISUAL_PATTERN_LEVELS } from './levels';
import type { VisualPatternChallenge, VisualPatternProfile } from './types';

export const VISUAL_PATTERN_ID = gameIdOf('visual-pattern-completion');

/** Shapes that look the same however they are turned, so only the pattern decides. */
const PLAIN_SHAPES: readonly ShapeKind[] = SHAPES.filter((s) => s !== 'triangle');
const MAX_COUNT = 6;

const cycleWords = (values: readonly string[]) => values.join(' → ');

interface Built {
  readonly items: Figure[];
  readonly answer: Figure;
  readonly rule: string;
}

function buildRepeat(random: RandomGenerator, profile: VisualPatternProfile): Built {
  const unit = pick(random, profile.units);
  const letters = [...new Set(unit)];
  const shapes = sample(random, PLAIN_SHAPES, letters.length);
  // Shapes always differ between letters; colours too at the first levels, then they may repeat.
  const colors = profile.offset
    ? letters.map(() => pick(random, COLORS.slice(0, 4)))
    : sample(random, COLORS, letters.length);
  const figures = new Map(
    letters.map((l, i) => [l, figure(shapes[i] as ShapeKind, colors[i] as ColorName)]),
  );
  const offset = profile.offset ? randomInt(random, 0, unit.length - 1) : 0;
  const n = Math.max(profile.shown, 2 * unit.length);
  const at = (i: number) => figures.get(unit[(offset + i) % unit.length] as string) as Figure;
  const items = Array.from({ length: n }, (_, i) => at(i));
  const block = Array.from({ length: unit.length }, (_, i) =>
    figureLabel(at(i), { withCount: false }),
  );
  return {
    items,
    answer: at(n),
    rule: `The block ${cycleWords(block)} repeats again and again.`,
  };
}

function buildRules(random: RandomGenerator, profile: VisualPatternProfile): Built | null {
  const ps = profile.shapePeriods.length > 0 ? pick(random, profile.shapePeriods) : 0;
  const pc = profile.colorPeriods.length > 0 ? pick(random, profile.colorPeriods) : 0;
  if (profile.kind === 'two-rules' && ps === pc) return null;
  const rotation = profile.growth === 'rotation';
  const shapes: FigureShape[] = rotation
    ? ['arrow']
    : sample(random, PLAIN_SHAPES, Math.max(ps, 1));
  const colors = sample(random, COLORS, Math.max(pc, 1));
  const so = randomInt(random, 0, shapes.length - 1);
  const co = randomInt(random, 0, colors.length - 1);
  let n = Math.max(profile.shown, 2 * ps, 2 * pc);
  let count: (i: number) => number = () => 1;
  let angle: (i: number) => Rotation = () => 0;
  const parts: string[] = [];
  if (profile.growth === 'count') {
    n = Math.min(n, MAX_COUNT - 1);
    if (2 * ps > n || 2 * pc > n) return null;
    const step = profile.shapePeriods.length > 0 && chance(random, 0.5) ? -1 : 1;
    const start =
      step > 0 ? randomInt(random, 1, MAX_COUNT - n) : randomInt(random, n + 1, MAX_COUNT);
    count = (i) => start + step * i;
    parts.push(`the number of shapes goes ${step > 0 ? 'up' : 'down'} by one each time`);
  }
  if (rotation) {
    const step = pick(random, [90, -90]);
    const start = pick(random, [0, 90, 180, 270] as const);
    angle = (i) => turn(start, step * i);
    parts.push(
      `the arrow turns a quarter turn ${step > 0 ? 'clockwise' : 'anticlockwise'} each time`,
    );
  }
  const shapeAt = (i: number) => shapes[(so + i) % shapes.length] as FigureShape;
  const colorAt = (i: number) => colors[(co + i) % colors.length] as ColorName;
  if (ps > 1)
    parts.push(
      `shapes repeat every ${ps}: ${cycleWords(Array.from({ length: ps }, (_, i) => shapeAt(i)))}`,
    );
  if (pc > 1)
    parts.push(
      `colours repeat every ${pc}: ${cycleWords(Array.from({ length: pc }, (_, i) => colorAt(i)))}`,
    );
  const at = (i: number) => figure(shapeAt(i), colorAt(i), count(i), angle(i));
  const items = Array.from({ length: n }, (_, i) => at(i));
  const text = parts.join('; ');
  return { items, answer: at(n), rule: `${text.charAt(0).toUpperCase()}${text.slice(1)}.` };
}

/**
 * Independent check: every feature (shape, colour, count, direction) read on its own, and the row
 * read as whole figures, must all lead to the same next figure, with two full cycles shown.
 */
export function solveRow(items: readonly Figure[]): Figure | null {
  const shapePeriod = minimalPeriod(items.map((f) => f.shape));
  const colorPeriod = minimalPeriod(items.map((f) => f.color));
  if (shapePeriod === null || colorPeriod === null) return null;
  const counts = nextCandidates(items.map((f) => f.count));
  const angles = nextCandidates(
    items.map((f) => f.rotation),
    360,
  );
  if (counts.length !== 1 || angles.length !== 1) return null;
  const next = figure(
    items[items.length - shapePeriod]?.shape as FigureShape,
    items[items.length - colorPeriod]?.color as ColorName,
    counts[0] ?? 1,
    angles[0] as Rotation,
  );
  const whole = minimalPeriod(items.map((f) => figureLabel(f)));
  if (whole !== null && figureLabel(items[items.length - whole] as Figure) !== figureLabel(next))
    return null;
  return next;
}

const others = <V>(values: readonly V[], answer: V, extra: readonly V[]) => {
  const seen = [...new Set(values)].filter((v) => v !== answer);
  const unseen = extra.filter((v) => v !== answer && !seen.includes(v));
  return unseen.length > 0 ? [...seen, unseen[0] as V] : seen;
};

function draft(random: RandomGenerator, profile: VisualPatternProfile) {
  return retryGeneration('visual pattern', (): Draft<VisualPatternChallenge> | null => {
    const built =
      profile.kind === 'repeat' ? buildRepeat(random, profile) : buildRules(random, profile);
    if (built === null) return null;
    const { items, answer } = built;
    const solved = solveRow(items);
    if (solved === null || figureLabel(solved) !== figureLabel(answer)) return null;
    const varies = (values: readonly unknown[]) => new Set(values).size > 1;
    const shapes = items.map((f) => f.shape);
    const colors = items.map((f) => f.color);
    const counts = items.map((f) => f.count);
    const angles = items.map((f) => f.rotation);
    const pool = answer.shape === 'arrow' ? [] : sample(random, PLAIN_SHAPES, PLAIN_SHAPES.length);
    const countPool = [answer.count + 1, answer.count - 1].filter((c) => c >= 1 && c <= MAX_COUNT);
    const alternatives = (all: boolean) => ({
      ...(all || varies(shapes) ? { shape: others(shapes, answer.shape, pool) } : {}),
      ...(all || varies(colors)
        ? { color: others(colors, answer.color, sample(random, COLORS, COLORS.length)) }
        : {}),
      ...(varies(counts) ? { count: others(counts, answer.count, countPool) } : {}),
      ...(varies(angles)
        ? { rotation: others(angles, answer.rotation, [0, 90, 180, 270] as Rotation[]) }
        : {}),
    });
    const key = (f: Figure) => figureLabel(f);
    const options =
      balancedDesign(random, answer, alternatives(false), profile.options, key) ??
      balancedDesign(random, answer, alternatives(true), profile.options, key);
    if (options === null) return null;
    const [right, ...wrong] = options.map(key);
    return {
      prompt: 'What comes next in the row?',
      content: { kind: profile.kind, items },
      response: singleChoice(random, right as string, wrong),
      explanation: `${built.rule} So the next one is ${figureLabel(answer)}.`,
      skills:
        profile.kind === 'repeat'
          ? ['pattern-recognition', 'sequential-thinking']
          : ['pattern-recognition', 'abstraction', 'sequential-thinking'],
    };
  });
}

export const visualPatternGame: GameDefinition<VisualPatternChallenge, VisualPatternProfile> = {
  id: VISUAL_PATTERN_ID,
  name: 'Visual Pattern Completion',
  tagline: 'What comes next in the row?',
  description:
    'A row of coloured shapes follows a pattern: a block that repeats, a number of shapes that grows, an arrow that turns, or shapes and colours that cycle separately. Choose the figure that comes next.',
  area: 'patterns',
  skills: ['pattern-recognition', 'sequential-thinking', 'abstraction'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 3,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Each row counts as correct when you choose the figure that continues it. Your result is the share of rows continued correctly; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'Look at the row from left to right and find what repeats or changes.',
    'Check each feature on its own: shape, colour, how many, and which way an arrow points.',
    'Choose the figure that comes next. Keys 1 to 8 pick an option.',
  ],
  simpleInstructions: 'Find the pattern and pick what comes next.',
  levels: VISUAL_PATTERN_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
