import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { constraintSolverGame } from './content/definition';
import { CONSTRAINT_LEVELS } from './content/levels';
import { solveGrid } from './content/solver';
import { constraintSolverModule } from './index';

describeGameContract(constraintSolverModule);

/** Independent check that a full grid keeps every rule. */
function validGrid(
  size: number,
  box: readonly [number, number] | null,
  g: readonly number[],
): boolean {
  const groups: number[][] = [];
  for (let r = 0; r < size; r++) groups.push([...Array(size).keys()].map((c) => r * size + c));
  for (let c = 0; c < size; c++) groups.push([...Array(size).keys()].map((r) => r * size + c));
  if (box) {
    const [bh, bw] = box;
    for (let r0 = 0; r0 < size; r0 += bh)
      for (let c0 = 0; c0 < size; c0 += bw) {
        const cells: number[] = [];
        for (let dr = 0; dr < bh; dr++)
          for (let dc = 0; dc < bw; dc++) cells.push((r0 + dr) * size + c0 + dc);
        groups.push(cells);
      }
  }
  return groups.every((cells) => new Set(cells.map((i) => g[i])).size === size);
}

describe('Constraint Solver', () => {
  it('each grid has exactly one solution and the answer is its asked cell', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(10, 3)) {
        const c = generateChallenge(constraintSolverGame, { level, seed });
        const { content } = c;
        const solutions = solveGrid(content, 5);
        expect(solutions).toHaveLength(1);
        expect(solutions[0]).toEqual(content.solution);
        expect(validGrid(content.size, content.box, content.solution)).toBe(true);
        for (const { smaller, larger } of content.inequalities)
          expect(content.solution[smaller] as number).toBeLessThan(
            content.solution[larger] as number,
          );
        content.givens.forEach((v, i) => {
          if (v !== null) expect(v).toBe(content.solution[i]);
        });
        expect(content.givens[content.asked]).toBeNull();
        if (c.response.format !== 'numeric') throw new Error('numeric expected');
        expect(c.response.solution.value).toBe(content.solution[content.asked]);
      }
    }
  });

  it('grows the grid across levels', () => {
    expectNonDecreasing(CONSTRAINT_LEVELS, (p) => p.size, 'grid size');
    expect(CONSTRAINT_LEVELS[10].inequalities).toBeGreaterThan(0);
  });
});
