import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { sequenceRecallGame } from './content/definition';
import { SEQUENCE_RECALL_LEVELS } from './content/levels';
import { sequenceRecallModule } from './index';

describeGameContract(sequenceRecallModule);

describe('Sequence Recall content', () => {
  it('asks for the shown order, or its reverse, using only pad symbols', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let seed = 0; seed < 20; seed++) {
        const c = generateChallenge(sequenceRecallGame, { level, seed: toSeed(seed) });
        if (c.response.format !== 'sequence') throw new Error('sequence expected');
        const expected =
          c.content.kind === 'forward' ? c.content.items : [...c.content.items].reverse();
        expect(c.response.solution.sequence).toEqual(expected);
        expect(c.content.items).toHaveLength(SEQUENCE_RECALL_LEVELS[level].length);
        const pad = new Set(c.response.question.symbols.map((s) => s.id));
        expect(c.content.items.every((id) => pad.has(id))).toBe(true);
      }
    }
  });

  it('never shows the same symbol twice in a row', () => {
    for (let seed = 0; seed < 100; seed++) {
      const { items } = generateChallenge(sequenceRecallGame, {
        level: 10,
        seed: toSeed(seed),
      }).content;
      expect(items.every((id, i) => i === 0 || items[i - 1] !== id)).toBe(true);
    }
  });

  it('lengthens the span and shortens exposure across levels', () => {
    expectNonDecreasing(SEQUENCE_RECALL_LEVELS, (p) => p.length, 'length');
    expectNonDecreasing(SEQUENCE_RECALL_LEVELS, (p) => -p.itemMs, 'speed');
  });

  it('gives the study phase enough time to show every item', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const p = SEQUENCE_RECALL_LEVELS[level];
      expect(p.timing.studyMs).toBeGreaterThan(p.length * p.itemMs);
    }
  });
});
