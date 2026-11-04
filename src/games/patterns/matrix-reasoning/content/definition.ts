import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg, type Message, type Text } from '@/domain/shared';
import { colorLabel, COLORS, SHAPES, type ColorName } from '@/games/kit/content';
import {
  balancedDesign,
  DIRECTION,
  figure,
  figureKey,
  figureLabel,
  ROTATION_VALUES,
  textChoice,
  type Draft,
  type Figure,
  type FigureShape,
  type Rotation,
} from '../../shared/content';
import { MATRIX_LEVELS } from './levels';
import { solveLayer, type Layer } from './solver';
import type {
  MatrixAttribute,
  MatrixChallenge,
  MatrixContent,
  MatrixProfile,
  MatrixRule,
} from './types';

export const MATRIX_ID = gameIdOf('matrix-reasoning');

/** Shapes that look the same however they are turned; arrows carry direction on their own. */
export const MATRIX_SHAPES: readonly FigureShape[] = SHAPES.filter((s) => s !== 'triangle');
const MAX_COUNT = 4;

const FIGURE_INDEX: readonly FigureShape[] = [...MATRIX_SHAPES, 'arrow', 'triangle'];

/** Numeric code of each feature, as read by the solver. */
export const encode: Record<MatrixAttribute, (f: Figure) => number> = {
  shape: (f) => FIGURE_INDEX.indexOf(f.shape),
  color: (f) => COLORS.indexOf(f.color),
  count: (f) => f.count,
  rotation: (f) => f.rotation,
};

export const numericOf = (a: MatrixAttribute) =>
  a === 'count' ? 'count' : a === 'rotation' ? 'rotation' : null;

export function layerOf(cells: MatrixContent['cells'], attribute: MatrixAttribute): Layer {
  return cells.map((row) => row.map((f) => (f === null ? null : encode[attribute](f))));
}

/** Independent solve: each feature must be fixed by the visible cells under every fitting rule. */
export function solveMatrix(cells: MatrixContent['cells']): Figure | null {
  const values = (['shape', 'color', 'count', 'rotation'] as const).map((a) =>
    solveLayer(layerOf(cells, a), numericOf(a)),
  );
  const [shape, color, count, rotation] = values;
  if (values.some((v) => v === null)) return null;
  return figure(
    FIGURE_INDEX[shape as number] as FigureShape,
    COLORS[color as number] as ColorName,
    count as number,
    rotation as Rotation,
  );
}

interface Layout<V> {
  readonly values: V[][];
  readonly words: Text;
}

const T = 'patterns:matrixReasoning';

const grid = <V>(n: number, at: (r: number, c: number) => V): V[][] =>
  Array.from({ length: n }, (_, r) => Array.from({ length: n }, (__, c) => at(r, c)));

function categorical<V>(
  rule: MatrixRule,
  n: number,
  palette: readonly V[],
  attribute: MatrixAttribute,
  name: (v: V) => Text,
): Layout<V> {
  const layout = (rule: string, values?: Record<string, Text>): Message =>
    msg(`${T}.layout.${attribute}.${rule}`, values);
  const v = (i: number) => palette[i % palette.length] as V;
  const listed = joinText(palette.slice(0, n).map(name));
  switch (rule) {
    case 'by-row':
      return {
        values: grid(n, (r) => v(r)),
        words: layout('byRow', { list: listed }),
      };
    case 'by-column':
      return {
        values: grid(n, (_, c) => v(c)),
        words: layout('byColumn', { list: listed }),
      };
    case 'latin-down':
    case 'latin-up':
      return {
        values: grid(n, (r, c) => v(rule === 'latin-down' ? (r + c) % n : (r - c + n) % n)),
        words: layout('latin', { list: listed }),
      };
    default:
      return {
        values: grid(n, () => v(0)),
        words: layout('constant', { value: name(v(0)) }),
      };
  }
}

function stepped(
  random: RandomGenerator,
  rule: 'step-row' | 'step-column',
  n: number,
  attribute: 'count' | 'rotation',
): Layout<number> {
  const along = rule === 'step-row' ? 'Row' : 'Column';
  if (attribute === 'count') {
    const step = pick(random, [1, -1]);
    const bases = Array.from({ length: n }, () =>
      step > 0 ? randomInt(random, 1, MAX_COUNT - n + 1) : randomInt(random, n, MAX_COUNT),
    );
    const values = grid(n, (line, pos) => (bases[line] as number) + step * pos);
    return {
      values:
        rule === 'step-row' ? values : grid(n, (r, c) => (values[c] as number[])[r] as number),
      words: msg(`${T}.layout.count.step${along}${step > 0 ? 'More' : 'Fewer'}`),
    };
  }
  const step = pick(random, [90, 270]);
  const bases = Array.from({ length: n }, () => pick(random, ROTATION_VALUES));
  const values = grid(n, (line, pos) => ((bases[line] as number) + step * pos) % 360);
  return {
    values: rule === 'step-row' ? values : grid(n, (r, c) => (values[c] as number[])[r] as number),
    words: msg(`${T}.layout.rotation.step${along}${step === 90 ? 'Clockwise' : 'Anticlockwise'}`),
  };
}

const attributeOrder: readonly MatrixAttribute[] = ['shape', 'color', 'count', 'rotation'];

function draft(random: RandomGenerator, profile: MatrixProfile): Draft<MatrixChallenge> {
  const n = profile.size;
  return retryGeneration('matrix', () => {
    const available = (Object.keys(profile.rules) as MatrixAttribute[]).filter(
      (a) => (profile.rules[a]?.length ?? 0) > 0,
    );
    const varying = sample(random, available, Math.min(profile.varying, available.length));
    // Arrows carry direction; with turning arrows the shape stays an arrow.
    if (varying.includes('rotation') && varying.includes('shape')) return null;
    const ruleOf = (a: MatrixAttribute): MatrixRule =>
      varying.includes(a) ? pick(random, profile.rules[a] ?? ['constant']) : 'constant';
    const rules = Object.fromEntries(attributeOrder.map((a) => [a, ruleOf(a)])) as Record<
      MatrixAttribute,
      MatrixRule
    >;
    // Two features laid out the same way would read as one rule.
    const used = varying.map((a) => rules[a]);
    if (new Set(used).size !== used.length) return null;

    const arrows = varying.includes('rotation');
    const shapes = categorical(
      rules.shape,
      n,
      arrows ? ['arrow'] : sample(random, MATRIX_SHAPES, n),
      'shape',
      (s) => msg(`patterns:shared.shapes.${s}`),
    );
    const colors = categorical(rules.color, n, sample(random, COLORS, n), 'color', colorLabel);
    const countPalette = shuffle(random, [1, 2, 3]);
    const counts =
      rules.count === 'step-row' || rules.count === 'step-column'
        ? stepped(random, rules.count, n, 'count')
        : categorical(
            rules.count,
            n,
            varying.includes('count') ? countPalette : [1],
            'count',
            (c) => String(c),
          );
    const rotationPalette = sample(random, ROTATION_VALUES, n);
    const rotations: Layout<number> = !arrows
      ? { values: grid(n, () => 0), words: '' }
      : rules.rotation === 'step-row' || rules.rotation === 'step-column'
        ? stepped(random, rules.rotation, n, 'rotation')
        : categorical(
            rules.rotation,
            n,
            varying.includes('rotation') ? rotationPalette : [0],
            'rotation',
            (r) => msg(`patterns:shared.direction.${DIRECTION[r as Rotation]}`),
          );
    const full = grid(n, (r, c) =>
      figure(
        (shapes.values[r] as FigureShape[])[c] as FigureShape,
        (colors.values[r] as ColorName[])[c] as ColorName,
        (counts.values[r] as number[])[c] as number,
        (rotations.values[r] as number[])[c] as Rotation,
      ),
    );
    const [mr, mc] = profile.anywhere
      ? [randomInt(random, 0, n - 1), randomInt(random, 0, n - 1)]
      : [n - 1, n - 1];
    const answer = (full[mr] as Figure[])[mc] as Figure;
    const cells = full.map((row, r) => row.map((f, c) => (r === mr && c === mc ? null : f)));
    const solved = solveMatrix(cells);
    if (solved === null || figureKey(solved) !== figureKey(answer)) return null;

    // Wrong values come from the matrix itself, plus at most one value not shown.
    const visible = cells.flat().filter((f): f is Figure => f !== null);
    const alternativesFor = <V>(values: readonly V[], answerValue: V, unseen: readonly V[]) => {
      const seen = [...new Set(values)].filter((v) => v !== answerValue);
      const extra = unseen.find((v) => v !== answerValue && !seen.includes(v));
      return extra === undefined ? seen : [...seen, extra];
    };
    const pools = {
      shape: arrows ? [] : sample(random, MATRIX_SHAPES, MATRIX_SHAPES.length),
      color: sample(random, COLORS, COLORS.length),
      count: shuffle(random, [1, 2, 3, 4]),
      rotation: shuffle(random, [...ROTATION_VALUES]),
    };
    const alternatives = (all: boolean) => {
      const pickAttr = (a: MatrixAttribute) => all || varying.includes(a);
      return {
        ...(pickAttr('shape')
          ? {
              shape: alternativesFor(
                visible.map((f) => f.shape),
                answer.shape,
                pools.shape,
              ),
            }
          : {}),
        ...(pickAttr('color')
          ? {
              color: alternativesFor(
                visible.map((f) => f.color),
                answer.color,
                pools.color,
              ),
            }
          : {}),
        ...(pickAttr('count')
          ? {
              count: alternativesFor(
                visible.map((f) => f.count),
                answer.count,
                pools.count,
              ),
            }
          : {}),
        ...(arrows
          ? {
              rotation: alternativesFor(
                visible.map((f) => f.rotation),
                answer.rotation,
                pools.rotation,
              ),
            }
          : {}),
      };
    };
    const key = (f: Figure) => figureKey(f);
    const options =
      balancedDesign(random, answer, alternatives(false), profile.options, key) ??
      balancedDesign(random, answer, alternatives(true), profile.options, key);
    if (options === null) return null;
    const [right, ...wrong] = options.map((f) => figureLabel(f));

    const layouts: Record<MatrixAttribute, Layout<unknown>> = {
      shape: shapes,
      color: colors,
      count: counts,
      rotation: rotations,
    };
    const ruleLines = attributeOrder
      .filter((a) => varying.includes(a))
      .map((a) => msg(`${T}.line.${a}`, { rule: layouts[a].words }));
    const kind: MatrixContent['kind'] = arrows
      ? 'arrows'
      : varying.includes('count')
        ? 'counts'
        : 'shapes-colours';
    return {
      prompt: msg(`${T}.prompt`),
      content: { kind, size: n, cells },
      response: textChoice(random, right as Message, wrong),
      explanation: msg(`${T}.explanation`, {
        rules: joinText(ruleLines, ' '),
        row: mr + 1,
        column: mc + 1,
        answer: figureLabel(answer),
      }),
      skills: ['pattern-recognition', 'abstraction', 'logical-reasoning'],
    };
  });
}

export const matrixReasoningGame: GameDefinition<MatrixChallenge, MatrixProfile> = {
  id: MATRIX_ID,
  name: msg('patterns:matrixReasoning.name'),
  tagline: msg('patterns:matrixReasoning.tagline'),
  description: msg('patterns:matrixReasoning.description'),
  area: 'patterns',
  skills: ['pattern-recognition', 'abstraction', 'logical-reasoning', 'spatial-reasoning'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('patterns:matrixReasoning.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('patterns:matrixReasoning.instructions.1'),
    msg('patterns:matrixReasoning.instructions.2'),
    msg('patterns:matrixReasoning.instructions.3'),
  ],
  simpleInstructions: msg('patterns:matrixReasoning.simpleInstructions'),
  levels: MATRIX_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
