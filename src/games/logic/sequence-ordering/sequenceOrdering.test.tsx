import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { sequenceOrderingGame } from './content/definition';
import { SEQUENCE_ORDERING_LEVELS } from './content/levels';
import { clueHolds, solveOrders } from './content/solver';
import { sequenceOrderingModule } from './index';

describeGameContract(sequenceOrderingModule);

describe('Sequence Ordering', () => {
  it('exactly one order fits the clues, with no redundant clue, and it is the solution', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(15, 11)) {
        const c = generateChallenge(sequenceOrderingGame, { level, seed });
        const { entities, clues, solution } = c.content;
        expect(clues.every((clue) => clueHolds(clue, solution))).toBe(true);
        expect(solveOrders(entities, clues)).toEqual([solution]);
        for (const clue of clues) {
          expect(
            solveOrders(
              entities,
              clues.filter((x) => x !== clue),
            ).length,
          ).toBeGreaterThan(1);
        }
        const { response } = c;
        if (response.format !== 'ordering') throw new Error('ordering expected');
        const label = (id: string) => response.question.items.find((i) => i.id === id)?.label;
        expect(response.solution.order.map(label)).toEqual(solution);
        expect(response.question.items.map((i) => i.label)).not.toEqual(solution);
      }
    }
  });

  it('adds people across levels', () => {
    expectNonDecreasing(SEQUENCE_ORDERING_LEVELS, (p) => p.entities, 'entities');
    expect(SEQUENCE_ORDERING_LEVELS[10].clueTypes.at).toBeUndefined();
  });
});
