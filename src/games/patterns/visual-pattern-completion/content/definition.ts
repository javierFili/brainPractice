import { retryGeneration, type GameDefinition } from '@/domain/game';
import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg, type Message, type TextValue } from '@/domain/shared';
import { colorLabel, COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import {
  balancedDesign,
  figure,
  figureKey,
  figureLabel,
  minimalPeriod,
  nextCandidates,
  textChoice,
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

const T = 'patterns:visualPatternCompletion';

interface Built {
  readonly items: Figure[];
  readonly answer: Figure;
  readonly rule: Message;
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
    rule: msg(`${T}.rule.repeat`, { block: joinText(block, ' → ') }),
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
  // Each part is a clause; the first one starts the sentence (capitalised in its own key).
  const parts: Message[] = [];
  const part = (name: string, values?: Record<string, TextValue>) =>
    msg(`${T}.${parts.length === 0 ? 'partStart' : 'part'}.${name}`, values);
  if (profile.growth === 'count') {
    n = Math.min(n, MAX_COUNT - 1);
    if (2 * ps > n || 2 * pc > n) return null;
    const step = profile.shapePeriods.length > 0 && chance(random, 0.5) ? -1 : 1;
    const start =
      step > 0 ? randomInt(random, 1, MAX_COUNT - n) : randomInt(random, n + 1, MAX_COUNT);
    count = (i) => start + step * i;
    parts.push(part(step > 0 ? 'countUp' : 'countDown'));
  }
  if (rotation) {
    const step = pick(random, [90, -90]);
    const start = pick(random, [0, 90, 180, 270] as const);
    angle = (i) => turn(start, step * i);
    parts.push(part(step > 0 ? 'turnClockwise' : 'turnAnticlockwise'));
  }
  const shapeAt = (i: number) => shapes[(so + i) % shapes.length] as FigureShape;
  const colorAt = (i: number) => colors[(co + i) % colors.length] as ColorName;
  if (ps > 1)
    parts.push(
      part('shapes', {
        count: ps,
        cycle: joinText(
          Array.from({ length: ps }, (_, i) => msg(`patterns:shared.shape.${shapeAt(i)}`)),
          ' → ',
        ),
      }),
    );
  if (pc > 1)
    parts.push(
      part('colours', {
        count: pc,
        cycle: joinText(
          Array.from({ length: pc }, (_, i) => colorLabel(colorAt(i))),
          ' → ',
        ),
      }),
    );
  const at = (i: number) => figure(shapeAt(i), colorAt(i), count(i), angle(i));
  const items = Array.from({ length: n }, (_, i) => at(i));
  return { items, answer: at(n), rule: msg(`${T}.rule.parts`, { parts: joinText(parts, '; ') }) };
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
  const whole = minimalPeriod(items.map((f) => figureKey(f)));
  if (whole !== null && figureKey(items[items.length - whole] as Figure) !== figureKey(next))
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
    if (solved === null || figureKey(solved) !== figureKey(answer)) return null;
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
    const key = (f: Figure) => figureKey(f);
    const options =
      balancedDesign(random, answer, alternatives(false), profile.options, key) ??
      balancedDesign(random, answer, alternatives(true), profile.options, key);
    if (options === null) return null;
    const [right, ...wrong] = options.map((f) => figureLabel(f));
    return {
      prompt: msg(`${T}.prompt`),
      content: { kind: profile.kind, items },
      response: textChoice(random, right as Message, wrong),
      explanation: msg(`${T}.explanation`, { rule: built.rule, answer: figureLabel(answer) }),
      skills:
        profile.kind === 'repeat'
          ? ['pattern-recognition', 'sequential-thinking']
          : ['pattern-recognition', 'abstraction', 'sequential-thinking'],
    };
  });
}

export const visualPatternGame: GameDefinition<VisualPatternChallenge, VisualPatternProfile> = {
  id: VISUAL_PATTERN_ID,
  name: msg('patterns:visualPatternCompletion.name'),
  tagline: msg('patterns:visualPatternCompletion.tagline'),
  description: msg('patterns:visualPatternCompletion.description'),
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
    scoringSummary: msg('patterns:visualPatternCompletion.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('patterns:visualPatternCompletion.instructions.1'),
    msg('patterns:visualPatternCompletion.instructions.2'),
    msg('patterns:visualPatternCompletion.instructions.3'),
  ],
  simpleInstructions: msg('patterns:visualPatternCompletion.simpleInstructions'),
  levels: VISUAL_PATTERN_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
