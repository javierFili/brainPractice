import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { en } from '@/test/i18n';
import { numberRecallGame, valueOf } from './content/definition';
import { NUMBER_RECALL_LEVELS } from './content/levels';
import type { ChunkedNumber } from './content/types';
import { numberRecallModule } from './index';

describeGameContract(numberRecallModule);

const digitsHeld = (groups: readonly number[], kind: string) =>
  groups.reduce((a, b) => a + b, 0) * (kind === 'two-numbers' ? 2 : 1);

describe('Number Recall content', () => {
  it('asks for the shown number or the chunk in the asked place', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let s = 0; s < 40; s++) {
        const c = generateChallenge(numberRecallGame, { level, seed: toSeed(level * 1000 + s) });
        const { numbers, ask, kind } = c.content;
        const target = numbers[ask.number] as ChunkedNumber;
        // No chunk starts with 0, so typing the digits never drops one.
        for (const n of numbers) for (const g of n.groups) expect(g[0]).not.toBe('0');
        expect(new Set(numbers.map(valueOf)).size).toBe(numbers.length);
        if (kind === 'which-group') {
          if (c.response.format !== 'single-choice') throw new Error('choice expected');
          const { options } = c.response.question;
          const { optionId } = c.response.solution;
          const right = options.filter((o) => o.id === optionId);
          expect(right.map((o) => en(o.label))).toEqual([target.groups[ask.group as number]]);
          expect(new Set(target.groups).size).toBe(target.groups.length);
          // Every option has the same number of digits: length gives nothing away.
          expect(new Set(options.map((o) => en(o.label).length)).size).toBe(1);
        } else {
          if (c.response.format !== 'numeric') throw new Error('numeric expected');
          expect(c.response.solution.value).toBe(Number(target.groups.join('')));
          expect(String(c.response.solution.value)).toBe(target.groups.join(''));
        }
      }
    }
  });

  it('asks either of two numbers about equally often', () => {
    let first = 0;
    let total = 0;
    for (let s = 0; s < 200; s++) {
      const c = generateChallenge(numberRecallGame, { level: 6, seed: toSeed(s) });
      total++;
      if (c.content.ask.number === 0) first++;
    }
    expect(first / total).toBeGreaterThan(0.35);
    expect(first / total).toBeLessThan(0.65);
  });

  it('holds more digits as levels rise', () => {
    expectNonDecreasing(
      NUMBER_RECALL_LEVELS,
      (p) => Math.max(...p.variants.map((v) => digitsHeld(v.groups, v.kind))),
      'digits held',
    );
  });
});
