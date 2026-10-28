import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { markKey } from '../shared/content';
import { symbolCountingGame } from './content/definition';
import { SYMBOL_COUNTING_LEVELS } from './content/levels';
import { symbolCountingModule } from './index';

describeGameContract(symbolCountingModule);

describe('Symbol Counting', () => {
  it('answer = number of exact copies of the target, within the level range', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const p = SYMBOL_COUNTING_LEVELS[level];
      const answers = new Set<number>();
      for (const seed of contractSeeds(40)) {
        const c = generateChallenge(symbolCountingGame, { level, seed });
        const key = markKey(c.content.target);
        const copies = c.content.items.filter((m) => markKey(m) === key).length;
        if (c.response.format !== 'numeric') throw new Error('numeric expected');
        expect(c.response.solution.value).toBe(copies);
        expect(copies).toBeGreaterThanOrEqual(p.minTargets);
        expect(copies).toBeLessThanOrEqual(p.maxTargets);
        answers.add(copies);
      }
      expect(answers.size).toBeGreaterThan(1);
    }
  });

  it('uses look-alikes at higher levels', () => {
    const c = generateChallenge(symbolCountingGame, { level: 9, seed: toSeed(9) });
    const { target, items } = c.content;
    const lookalikes = items.filter(
      (m) =>
        markKey(m) !== markKey(target) && (m.shape === target.shape || m.color === target.color),
    );
    expect(lookalikes.length).toBeGreaterThan(items.length / 3);
  });

  it('grows the field and the count', () => {
    expectNonDecreasing(SYMBOL_COUNTING_LEVELS, (p) => p.columns * p.rows, 'cells');
    expectNonDecreasing(SYMBOL_COUNTING_LEVELS, (p) => p.maxTargets, 'targets');
    expectNonDecreasing(SYMBOL_COUNTING_LEVELS, (p) => p.lureShare, 'lure share');
  });
});
