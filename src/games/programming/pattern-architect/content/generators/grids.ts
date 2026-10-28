import { singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { chance, pick, randomInt, sample, type RandomGenerator } from '@/domain/random';
import { cellLabel, describeCell } from '../format';
import { analyseLayer, layerOf, solveGrid } from '../solvers/grid';
import { SHAPES, type GridCell, type GridRule, type PatternProfile, type Shape } from '../types';
import { pickDistractors, type PatternDraft } from './draft';

interface Layer<V> {
  readonly values: V[][];
  /** The rule in plain words, completing "Shapes: …" / "Counts: …". */
  readonly description: string;
}

const grid = <V>(size: number, at: (row: number, column: number) => V): V[][] =>
  Array.from({ length: size }, (_, r) => Array.from({ length: size }, (__, c) => at(r, c)));

const transposed = <V>(values: V[][]): V[][] =>
  grid(values.length, (r, c) => (values[c] as V[])[r] as V);

/** Rules that only need a palette of distinct values: valid for shapes and counts alike. */
function categoricalLayer<V>(rule: GridRule, size: number, palette: readonly V[]): Layer<V> {
  const value = (i: number) => palette[i % palette.length] as V;
  switch (rule) {
    case 'by-row':
      return { values: grid(size, (r) => value(r)), description: 'each row keeps one value' };
    case 'by-column':
      return {
        values: grid(size, (_, c) => value(c)),
        description: 'each column keeps one value',
      };
    case 'shift-left':
      return {
        values: grid(size, (r, c) => value((r + c) % size)),
        description:
          'each row is the row above moved one place to the left (the first wraps to the end)',
      };
    case 'shift-right':
      return {
        values: grid(size, (r, c) => value((c - r + size) % size)),
        description:
          'each row is the row above moved one place to the right (the last wraps to the front)',
      };
    default:
      return {
        values: grid(size, () => value(0)),
        description: 'the same in every cell',
      };
  }
}

function countLayer(random: RandomGenerator, rule: GridRule, size: number): Layer<number> {
  const maxCount = size === 3 ? 5 : 6;
  switch (rule) {
    case 'row-step':
    case 'column-step': {
      const step = pick(random, [1, -1]);
      const starts = Array.from({ length: size }, () =>
        step > 0 ? randomInt(random, 1, maxCount - size + 1) : randomInt(random, size, maxCount),
      );
      const values = grid(size, (r, c) => (starts[r] as number) + c * step);
      const line = rule === 'row-step' ? 'row' : 'column';
      const direction = rule === 'row-step' ? 'left to right' : 'top to bottom';
      return {
        values: rule === 'row-step' ? values : transposed(values),
        description: `along each ${line} (${direction}) the count goes ${step > 0 ? 'up' : 'down'} by one`,
      };
    }
    case 'row-sum':
    case 'column-sum': {
      const top = size === 3 ? 3 : 2;
      const values = grid(size, () => 0).map(() => {
        const parts = Array.from({ length: size - 1 }, () => randomInt(random, 1, top));
        return [...parts, parts.reduce((a, b) => a + b, 0)];
      });
      return rule === 'row-sum'
        ? { values, description: 'in each row the last count is the sum of the others' }
        : {
            values: transposed(values),
            description: 'in each column the bottom count is the sum of the others',
          };
    }
    default:
      return categoricalLayer(
        rule,
        size,
        sample(
          random,
          Array.from({ length: size + 1 }, (_, i) => i + 1),
          size,
        ),
      );
  }
}

const unique = <V>(values: readonly V[]) => [...new Set(values)];

export function symbolGrid(random: RandomGenerator, profile: PatternProfile): PatternDraft {
  const { size, varyingAttributes, shapeRules, countRules } = profile.grid;
  return retryGeneration('symbol grid', () => {
    const fixed = varyingAttributes === 2 ? null : chance(random, 0.5) ? 'shape' : 'count';
    const shapeRule: GridRule = fixed === 'shape' ? 'constant' : pick(random, shapeRules);
    const countRule: GridRule = fixed === 'count' ? 'constant' : pick(random, countRules);
    // Two attributes following the same layout would read as a single rule.
    if (fixed === null && shapeRule === countRule) return null;
    const shapes = categoricalLayer(shapeRule, size, sample(random, SHAPES, size));
    const counts = countLayer(random, countRule, size);
    const full = grid<GridCell>(size, (r, c) => ({
      shape: (shapes.values[r] as Shape[])[c] as Shape,
      count: (counts.values[r] as number[])[c] as number,
    }));
    const missing = { row: randomInt(random, 0, size - 1), column: randomInt(random, 0, size - 1) };
    const answer = (full[missing.row] as GridCell[])[missing.column] as GridCell;
    const cells = full.map((line, r) =>
      line.map((cell, c) => (r === missing.row && c === missing.column ? null : cell)),
    );
    const solved = solveGrid(cells);
    if (solved?.shape !== answer.shape || solved.count !== answer.count) return null;

    // Wrong values come from readings that do not fit the grid (copying a row instead of a
    // column, shifting the wrong way, miscounting a progression), then from other visible values.
    const visible = full.flat().filter((cell) => cell !== answer);
    const wrongShapes = unique([
      ...analyseLayer(layerOf(cells, 'shape'), missing).misreadings,
      ...visible.map((cell) => cell.shape),
    ]).filter((s): s is Shape => s !== answer.shape);
    const wrongCounts = unique([
      ...analyseLayer(layerOf(cells, 'count'), missing).misreadings,
      answer.count + 1,
      answer.count - 1,
      ...visible.map((cell) => cell.count),
    ]).filter((n): n is number => typeof n === 'number' && n >= 1 && n !== answer.count);
    const candidates: GridCell[] = [];
    for (let i = 0; i < 3; i++) {
      const s = wrongShapes[i];
      const n = wrongCounts[i];
      if (s !== undefined) candidates.push({ shape: s, count: answer.count });
      if (n !== undefined) candidates.push({ shape: answer.shape, count: n });
      if (s !== undefined && n !== undefined) candidates.push({ shape: s, count: n });
    }
    const wrong = pickDistractors(
      cellLabel(answer),
      candidates.map(cellLabel),
      profile.distractors,
    );
    if (wrong === null) return null;
    const position = `row ${missing.row + 1}, column ${missing.column + 1}`;
    return {
      prompt: 'Which cell completes the grid?',
      content: { kind: 'symbol-grid', cells },
      response: singleChoice(random, cellLabel(answer), wrong),
      explanation: `Shapes: ${shapes.description}. Counts: ${counts.description}. So the missing cell (${position}) is ${cellLabel(answer)} — ${describeCell(answer)}.`,
      skills: ['pattern-recognition', 'decomposition'],
    };
  });
}
