import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { truthAndFalsehoodGame } from './content/definition';
import { TRUTH_LEVELS } from './content/levels';
import { claimValue, describeGroup } from './content/solver';
import { truthAndFalsehoodModule } from './index';

describeGameContract(truthAndFalsehoodModule);

describe('Truth and Falsehood', () => {
  it('exactly one assignment is consistent and the answer follows from it', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(20, 17)) {
        const c = generateChallenge(truthAndFalsehoodGame, { level, seed });
        const { claims, names, solution, target, kind } = c.content;
        const n = names.length;
        // Independent brute force over bit masks.
        const consistent = [...Array(2 ** n).keys()]
          .map((mask) => [...Array(n).keys()].map((i) => ((mask >> i) & 1) === 1))
          .filter((w) => claims.every((claim, i) => claimValue(claim, w) === w[i]));
        expect(consistent).toEqual([solution]);
        // No self-referential "I am …" claims.
        claims.forEach((claim, i) => {
          if (claim.type === 'is') expect(claim.target).not.toBe(i);
        });
        const { response } = c;
        if (kind === 'count') {
          if (response.format !== 'numeric') throw new Error('numeric expected');
          expect(response.solution.value).toBe(solution.filter(Boolean).length);
        } else {
          if (response.format !== 'single-choice') throw new Error('single-choice expected');
          const label = response.question.options.find(
            (o) => o.id === response.solution.optionId,
          )?.label;
          expect(label).toBe(
            kind === 'one'
              ? solution[target]
                ? 'Truth-teller'
                : 'Liar'
              : describeGroup(solution, names),
          );
        }
      }
    }
  });

  it('adds characters across levels', () => {
    expectNonDecreasing(TRUTH_LEVELS, (p) => p.characters, 'characters');
  });
});
