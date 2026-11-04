import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { en } from '@/test/i18n';
import { associationMemoryGame, itemLabel } from './content/definition';
import { ASSOCIATION_LEVELS } from './content/levels';
import type { AssocPair } from './content/types';
import { associationMemoryModule } from './index';

describeGameContract(associationMemoryModule);

describe('Association Memory content', () => {
  it('has one right answer, and every option comes from the learned pairs', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let s = 0; s < 40; s++) {
        const c = generateChallenge(associationMemoryGame, {
          level,
          seed: toSeed(level * 700 + s),
        });
        const { pairs, ask } = c.content;
        if (c.response.format !== 'single-choice') throw new Error('choice expected');
        const side = (p: AssocPair) => en(itemLabel(ask.reversed ? p.cue : p.partner));
        const learned = pairs.map(side);
        expect(new Set(learned).size).toBe(pairs.length);
        const { options } = c.response.question;
        for (const o of options) expect(learned).toContain(en(o.label));
        // Oracle: look the asked item up in the pairs independently of the generator's index.
        const shown = (p: AssocPair) => en(itemLabel(ask.reversed ? p.partner : p.cue));
        const askedLabel = shown(pairs[ask.pair] as AssocPair);
        const matches = pairs.filter((p) => shown(p) === askedLabel).map(side);
        const { optionId } = c.response.solution;
        const right = options.find((o) => o.id === optionId);
        expect(matches).toEqual([right && en(right.label)]);
        expect(en(c.prompt)).toContain(askedLabel);
      }
    }
  });

  it('raises the load and reverses the direction across levels', () => {
    expectNonDecreasing(ASSOCIATION_LEVELS, (p) => p.pairs, 'pairs');
    expectNonDecreasing(ASSOCIATION_LEVELS, (p) => p.options, 'options');
    expect(ASSOCIATION_LEVELS[1].reversedShare).toBe(0);
    expect(ASSOCIATION_LEVELS[10].reversedShare).toBeGreaterThan(0);
  });

  it('asks in both directions on mixed levels', () => {
    const reversed = Array.from({ length: 60 }, (_, s) =>
      generateChallenge(associationMemoryGame, { level: 8, seed: toSeed(s) }),
    ).filter((c) => c.content.ask.reversed).length;
    expect(reversed).toBeGreaterThan(15);
    expect(reversed).toBeLessThan(45);
  });
});
