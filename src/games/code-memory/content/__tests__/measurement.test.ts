import { generateChallenge } from '@/domain/game';
import { deriveSeed, toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import {
  centroidRate,
  chanceRate,
  choiceItems,
  levenshtein,
  medianRate,
  type ChoiceItem,
} from '@/test/guessability';
import { codeMemoryGame } from '../definition';

/**
 * Measurement invariants: a player who remembers nothing must not beat chance by spotting the
 * option the others were derived from (digit permutations, ±1/±10 of the answer).
 */
const SEEDS = Array.from({ length: 300 }, (_, i) => deriveSeed(toSeed(20260930), i));
const numeric = (item: ChoiceItem) => item.options.every((o) => /^-?\d+$/.test(o));

describe('Code Memory — measurement invariants', () => {
  const byLevel = DIFFICULTY_LEVELS.map((level) => ({
    level,
    items: choiceItems(
      SEEDS.map((seed) => generateChallenge(codeMemoryGame, { level, seed })),
    ).filter(numeric),
  }));

  it('numeric options: the answer is not the option closest to the others', () => {
    for (const { level, items } of byLevel) {
      if (items.length < 30) continue;
      const limit = chanceRate(items) + 0.15;
      expect.soft(centroidRate(items, levenshtein), `level ${level} edit`).toBeLessThan(limit);
      expect
        .soft(
          centroidRate(items, (a, b) => Math.abs(Number(a) - Number(b))),
          `level ${level} distance`,
        )
        .toBeLessThan(limit);
      expect.soft(medianRate(items), `level ${level} median`).toBeLessThan(limit);
    }
  });
});
