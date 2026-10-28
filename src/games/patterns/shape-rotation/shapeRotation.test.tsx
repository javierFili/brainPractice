import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { parseGrid, type TileGrid } from '../shared/content';
import {
  expectFastGeneration,
  expectNoCentroidBias,
  generateMany,
  optionLabels,
  solutionLabel,
} from '../shared/testing';
import { shapeRotationGame } from './content/definition';
import { SHAPE_ROTATION_LEVELS } from './content/levels';
import { shapeRotationModule } from './index';

describeGameContract(shapeRotationModule);

// Independent oracle: cell sets turned with coordinate maps, normalised to the origin.
type Cells = [number, number][];
const cellsOf = (g: TileGrid): Cells =>
  g.flatMap((row, r) => row.flatMap((v, c) => (v ? [[r, c] as [number, number]] : [])));
const norm = (cells: Cells) => {
  const r0 = Math.min(...cells.map(([r]) => r));
  const c0 = Math.min(...cells.map(([, c]) => c));
  return cells
    .map(([r, c]) => `${r - r0},${c - c0}`)
    .sort()
    .join(' ');
};
const turn = (cells: Cells): Cells => cells.map(([r, c]) => [c, -r]);
const mirror = (cells: Cells): Cells => cells.map(([r, c]) => [r, -c]);
const turns = (cells: Cells) => {
  const out = [cells];
  for (let i = 0; i < 3; i++) out.push(turn(out.at(-1) as Cells));
  return out;
};
const grid = (label: string) => {
  const g = parseGrid(label);
  if (!g) throw new Error(`bad label ${label}`);
  return cellsOf(g);
};

describe('Shape Rotation', () => {
  const all = generateMany(shapeRotationGame);

  it('has exactly one option that is the reference turned, never the reference flipped', () => {
    for (const { challenge, level } of all) {
      const piece = cellsOf(challenge.content.piece);
      expect(piece).toHaveLength(SHAPE_ROTATION_LEVELS[level].cells);
      const rotations = new Set(turns(piece).map(norm));
      const mirrors = new Set(turns(mirror(piece)).map(norm));
      // Fully asymmetric: four turns and four mirror images all differ.
      expect(new Set([...rotations, ...mirrors]).size).toBe(8);
      const matches = optionLabels(challenge).filter((l) => rotations.has(norm(grid(l))));
      expect(matches).toEqual([solutionLabel(challenge)]);
      // The answer is really turned, not shown as is.
      expect(norm(grid(solutionLabel(challenge)))).not.toBe(norm(piece));
    }
  });

  it('pairs every option with its mirror image from level 2', () => {
    for (const { challenge, level } of all) {
      if (SHAPE_ROTATION_LEVELS[level].pairs === 0) continue;
      const labels = optionLabels(challenge);
      expect(labels).toHaveLength(SHAPE_ROTATION_LEVELS[level].pairs * 2);
      for (const label of labels) {
        const mirrored = new Set(turns(mirror(grid(label))).map(norm));
        expect(labels.filter((other) => mirrored.has(norm(grid(other))))).toHaveLength(1);
      }
    }
  });

  it('does not reward picking the piece most similar to the others', () => {
    const shapeDistance = (a: string, b: string) => {
      const target = grid(b);
      const keys = new Set(target.map(([r, c]) => `${r},${c}`));
      let best = Number.POSITIVE_INFINITY;
      for (const variant of [...turns(grid(a)), ...turns(mirror(grid(a)))]) {
        const r0 = Math.min(...variant.map(([r]) => r));
        const c0 = Math.min(...variant.map(([, c]) => c));
        const shared = variant.filter(([r, c]) => keys.has(`${r - r0},${c - c0}`)).length;
        best = Math.min(best, variant.length - shared);
      }
      return best;
    };
    expectNoCentroidBias(
      all.filter((e) => e.level >= 2).map((e) => e.challenge),
      shapeDistance,
    );
    // Level 1 on its own (no mirror images).
    expectNoCentroidBias(
      generateMany(shapeRotationGame, 120, [1]).map((e) => e.challenge),
      shapeDistance,
    );
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(SHAPE_ROTATION_LEVELS, (p) => p.cells, 'cells');
    expectNonDecreasing(
      SHAPE_ROTATION_LEVELS,
      (p) => Math.max(p.pairs * 2, p.others + 1),
      'options',
    );
  });

  it('generates quickly', () => {
    expectFastGeneration(shapeRotationGame);
  });
});
