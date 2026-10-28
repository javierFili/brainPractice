import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { parseGrid, type TileGrid } from '../shared/content';
import {
  expectFastGeneration,
  expectNoCentroidBias,
  generateMany,
  gridDistance,
  optionLabels,
  solutionLabel,
} from '../shared/testing';
import { spatialTransformGame } from './content/definition';
import { SPATIAL_TRANSFORM_LEVELS } from './content/levels';
import type { Step } from './content/types';
import { spatialTransformModule } from './index';

describeGameContract(spatialTransformModule);

// Independent oracle: each move as a coordinate map on a square grid.
function move(g: TileGrid, step: Step): number[][] {
  const n = g.length;
  const v = (r: number, c: number) => (g[r] as number[])[c] as number;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (__, c) => {
      switch (step) {
        case 'cw':
          return v(n - 1 - c, r);
        case 'ccw':
          return v(c, n - 1 - r);
        case '180':
          return v(n - 1 - r, n - 1 - c);
        case 'flip-lr':
          return v(r, n - 1 - c);
        case 'flip-ud':
          return v(n - 1 - r, c);
      }
    }),
  );
}
const same = (a: TileGrid, b: TileGrid) => JSON.stringify(a) === JSON.stringify(b);

describe('Spatial Transformation', () => {
  const all = generateMany(spatialTransformGame);

  it('offers exactly one option equal to the stated moves applied in order', () => {
    for (const { challenge, level } of all) {
      const { grid, steps } = challenge.content;
      expect(steps).toHaveLength(SPATIAL_TRANSFORM_LEVELS[level].stepCount);
      const expected = steps.reduce<TileGrid>((g, s) => move(g, s), grid);
      const matching = optionLabels(challenge).filter((l) => {
        const option = parseGrid(l);
        return option !== null && same(option, expected);
      });
      expect(matching).toEqual([solutionLabel(challenge)]);
      expect(same(expected, grid)).toBe(false);
    }
  });

  it('does not reward picking the option most similar to the others', () => {
    expectNoCentroidBias(
      all.map((e) => e.challenge),
      gridDistance,
    );
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(SPATIAL_TRANSFORM_LEVELS, (p) => p.size, 'size');
    expectNonDecreasing(SPATIAL_TRANSFORM_LEVELS, (p) => p.stepCount, 'steps');
    expectNonDecreasing(SPATIAL_TRANSFORM_LEVELS, (p) => p.options, 'options');
    expectNonDecreasing(SPATIAL_TRANSFORM_LEVELS, (p) => p.moves.length, 'moves');
  });

  it('generates quickly', () => {
    expectFastGeneration(spatialTransformGame);
  });
});
