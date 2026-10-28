import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { COLORS, SHAPES, type ColorName } from '@/games/kit/content';
import {
  balancedDesign,
  DIRECTION,
  figure,
  figureLabel,
  listWords,
  ROTATION_VALUES,
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
  readonly words: string;
}

const NOUN: Record<MatrixAttribute, [string, string]> = {
  shape: ['shape', 'shapes'],
  color: ['colour', 'colours'],
  count: ['number of shapes', 'numbers'],
  rotation: ['direction', 'directions'],
};

const grid = <V>(n: number, at: (r: number, c: number) => V): V[][] =>
  Array.from({ length: n }, (_, r) => Array.from({ length: n }, (__, c) => at(r, c)));

function categorical<V>(
  rule: MatrixRule,
  n: number,
  palette: readonly V[],
  attribute: MatrixAttribute,
  name: (v: V) => string,
): Layout<V> {
  const [noun, nouns] = NOUN[attribute];
  const v = (i: number) => palette[i % palette.length] as V;
  const listed = listWords(palette.slice(0, n).map(name));
  switch (rule) {
    case 'by-row':
      return {
        values: grid(n, (r) => v(r)),
        words: `each row keeps one ${noun} (${listed}, top to bottom)`,
      };
    case 'by-column':
      return {
        values: grid(n, (_, c) => v(c)),
        words: `each column keeps one ${noun} (${listed}, left to right)`,
      };
    case 'latin-down':
    case 'latin-up':
      return {
        values: grid(n, (r, c) => v(rule === 'latin-down' ? (r + c) % n : (r - c + n) % n)),
        words: `the ${nouns} ${listed} appear once in every row and every column`,
      };
    default:
      return {
        values: grid(n, () => v(0)),
        words: `every cell has the same ${noun}: ${name(v(0))}`,
      };
  }
}

function stepped(
  random: RandomGenerator,
  rule: 'step-row' | 'step-column',
  n: number,
  attribute: 'count' | 'rotation',
): Layout<number> {
  const along = rule === 'step-row' ? 'along each row, left to right' : 'down each column';
  if (attribute === 'count') {
    const step = pick(random, [1, -1]);
    const bases = Array.from({ length: n }, () =>
      step > 0 ? randomInt(random, 1, MAX_COUNT - n + 1) : randomInt(random, n, MAX_COUNT),
    );
    const values = grid(n, (line, pos) => (bases[line] as number) + step * pos);
    return {
      values:
        rule === 'step-row' ? values : grid(n, (r, c) => (values[c] as number[])[r] as number),
      words: `${along} there is one shape ${step > 0 ? 'more' : 'fewer'} in each cell`,
    };
  }
  const step = pick(random, [90, 270]);
  const bases = Array.from({ length: n }, () => pick(random, ROTATION_VALUES));
  const values = grid(n, (line, pos) => ((bases[line] as number) + step * pos) % 360);
  return {
    values: rule === 'step-row' ? values : grid(n, (r, c) => (values[c] as number[])[r] as number),
    words: `${along} the arrow turns a quarter turn ${step === 90 ? 'clockwise' : 'anticlockwise'} from cell to cell`,
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
      (s) => (s === 'cross' ? 'crosses' : `${s}s`),
    );
    const colors = categorical(rules.color, n, sample(random, COLORS, n), 'color', (c) => c);
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
            (r) => DIRECTION[r as Rotation],
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
    if (solved === null || figureLabel(solved) !== figureLabel(answer)) return null;

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
    const key = (f: Figure) => figureLabel(f);
    const options =
      balancedDesign(random, answer, alternatives(false), profile.options, key) ??
      balancedDesign(random, answer, alternatives(true), profile.options, key);
    if (options === null) return null;
    const [right, ...wrong] = options.map(key);

    const layouts: Record<MatrixAttribute, Layout<unknown>> = {
      shape: shapes,
      color: colors,
      count: counts,
      rotation: rotations,
    };
    const ruleLines = attributeOrder
      .filter((a) => varying.includes(a))
      .map(
        (a) => `${NOUN[a][0].charAt(0).toUpperCase()}${NOUN[a][0].slice(1)}: ${layouts[a].words}.`,
      );
    const kind: MatrixContent['kind'] = arrows
      ? 'arrows'
      : varying.includes('count')
        ? 'counts'
        : 'shapes-colours';
    return {
      prompt: 'Which figure completes the matrix?',
      content: { kind, size: n, cells },
      response: singleChoice(random, right as string, wrong),
      explanation: `${ruleLines.join(' ')} So the missing cell (row ${mr + 1}, column ${mc + 1}) is ${figureLabel(answer)}.`,
      skills: ['pattern-recognition', 'abstraction', 'logical-reasoning'],
    };
  });
}

export const matrixReasoningGame: GameDefinition<MatrixChallenge, MatrixProfile> = {
  id: MATRIX_ID,
  name: 'Matrix Reasoning',
  tagline: 'Find the rules of rows and columns.',
  description:
    'A grid of figures with one cell missing. Shape, colour, number and direction each follow their own rule across rows and columns. Work out every rule and choose the figure that fits the gap.',
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
    scoringSummary:
      'Each matrix counts as correct when you choose the figure that fits every rule. Your result is the share of matrices completed correctly; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'Look at one feature at a time: shape, colour, how many, and which way arrows point.',
    'Each feature follows its own rule: the same along a row, the same down a column, once in every row and column, or one step more each cell.',
    'Choose the figure that fits every rule at the gap. Every wrong option breaks at least one rule.',
  ],
  simpleInstructions: 'Look at the rows and columns and pick the picture that fits the gap.',
  levels: MATRIX_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
