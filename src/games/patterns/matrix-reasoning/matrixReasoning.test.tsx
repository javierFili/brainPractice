import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { chanceRate, choiceItems } from '@/test/guessability';
import { parseFigure, type Figure } from '../shared/content';
import {
  expectFastGeneration,
  expectNoCentroidBias,
  figureDistance,
  generateMany,
  optionLabels,
  solutionLabel,
} from '../shared/testing';
import { encode, matrixReasoningGame, numericOf } from './content/definition';
import { MATRIX_LEVELS } from './content/levels';
import type { MatrixAttribute } from './content/types';
import { matrixReasoningModule } from './index';

describeGameContract(matrixReasoningModule);

const ATTRIBUTES: readonly MatrixAttribute[] = ['shape', 'color', 'count', 'rotation'];

/** Oracle: does some rule of the library describe a complete layer of values? */
function explained(layer: number[][], numeric: 'count' | 'rotation' | null): boolean {
  const n = layer.length;
  const at = (r: number, c: number) => (layer[r] as number[])[c] as number;
  const keyed = [
    () => 0,
    (r: number) => r,
    (_: number, c: number) => c,
    (r: number, c: number) => (r + c) % n,
    (r: number, c: number) => (r - c + n) % n,
  ];
  const cells = Array.from({ length: n * n }, (_, i) => [Math.floor(i / n), i % n] as const);
  const functional = (key: (r: number, c: number) => number) =>
    cells.every(([r, c]) =>
      cells.every(([r2, c2]) => key(r, c) !== key(r2, c2) || at(r, c) === at(r2, c2)),
    );
  if (keyed.some(functional)) return true;
  if (numeric === null) return false;
  const mod = (v: number) => (numeric === 'rotation' ? ((v % 360) + 360) % 360 : v);
  const steps = numeric === 'count' ? [-3, -2, -1, 1, 2, 3] : [90, 180, 270];
  return steps.some(
    (step) =>
      cells.every(([r, c]) => c === 0 || mod(at(r, c) - at(r, c - 1)) === mod(step)) ||
      cells.every(([r, c]) => r === 0 || mod(at(r, c) - at(r - 1, c)) === mod(step)),
  );
}

describe('Matrix Reasoning', () => {
  const all = generateMany(matrixReasoningGame);

  it('has exactly one option that fits a rule for every feature', () => {
    for (const { challenge } of all) {
      const { cells } = challenge.content;
      const fitting = optionLabels(challenge).filter((label) => {
        const option = parseFigure(label) as Figure;
        const filled = cells.map((row) => row.map((f) => f ?? option));
        return ATTRIBUTES.every((a) =>
          explained(
            filled.map((row) => row.map((f) => encode[a](f))),
            numericOf(a),
          ),
        );
      });
      expect(fitting).toEqual([solutionLabel(challenge)]);
    }
  });

  it('every distractor breaks at least one feature of the answer', () => {
    for (const { challenge } of all) {
      const answer = solutionLabel(challenge);
      for (const label of optionLabels(challenge))
        if (label !== answer) expect(figureDistance(label, answer)).toBeGreaterThan(0);
    }
  });

  it('does not reward picking the most typical option', () => {
    const challenges = all.map((e) => e.challenge);
    expectNoCentroidBias(challenges, figureDistance);
    // Majority vote: the option whose features match the most common value of each feature.
    const items = choiceItems(challenges);
    let hits = 0;
    for (const item of items) {
      const figures = item.options.map((o) => parseFigure(o) as Figure);
      const score = (f: Figure) =>
        ATTRIBUTES.reduce(
          (sum, a) => sum + figures.filter((g) => encode[a](g) === encode[a](f)).length,
          0,
        );
      const scores = figures.map(score);
      const best = Math.max(...scores);
      const winners = item.options.filter((_, i) => scores[i] === best);
      if (winners.includes(item.answer)) hits += 1 / winners.length;
    }
    expect(hits / items.length).toBeLessThan(chanceRate(items) + 0.08);
  });

  it('uses 2×2 matrices first, then 3×3 with more rules and options', () => {
    expectNonDecreasing(MATRIX_LEVELS, (p) => p.size, 'size');
    expectNonDecreasing(MATRIX_LEVELS, (p) => p.size * p.size * p.varying, 'cells × rules');
    expectNonDecreasing(MATRIX_LEVELS, (p) => p.options, 'options');
    expectDistinctLevels(MATRIX_LEVELS);
    for (const { level, challenge } of all) {
      expect(challenge.content.cells.flat().filter((c) => c === null)).toHaveLength(1);
      if (!MATRIX_LEVELS[level].anywhere) expect(challenge.content.cells.at(-1)?.at(-1)).toBeNull();
    }
  });

  it('generates quickly', () => {
    expectFastGeneration(matrixReasoningGame);
  });
});
