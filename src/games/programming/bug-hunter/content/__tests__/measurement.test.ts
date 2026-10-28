import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { bugHunterGame } from '../definition';
import type { AttentionChallenge } from '../types';

/** Where the bug lands must carry no information: every position is possible, none is favoured. */
const SEEDS = Array.from({ length: 400 }, (_, i) => i * 6007 + 3);
const THIRDS = [
  [0, 1 / 3],
  [1 / 3, 2 / 3],
  [2 / 3, 1.0001],
] as const;

function thirds(challenges: readonly AttentionChallenge[]): number[] {
  const relative = challenges.map(({ response }) => {
    if (response.format !== 'locate') throw new Error('Bug Hunter answers by locating');
    return response.solution.index / (response.question.itemCount - 1);
  });
  return THIRDS.map(
    ([from, to]) => relative.filter((r) => r >= from && r < to).length / relative.length,
  );
}

describe('Bug Hunter — measurement invariants', () => {
  const byLevel = DIFFICULTY_LEVELS.map((level) => ({
    level,
    challenges: SEEDS.map((seed) => generateChallenge(bugHunterGame, { level, seed })),
  }));

  it('record artifacts: the bug is spread evenly, first item included', () => {
    for (const { level, challenges } of byLevel) {
      const records = challenges.filter((c) => c.content.kind !== 'code-rule');
      const first = records.filter(
        (c) => c.response.format === 'locate' && c.response.solution.index === 0,
      );
      expect.soft(first.length, `level ${level}: bug at item 1`).toBeGreaterThan(0);
      thirds(records).forEach((share, i) => {
        expect.soft(share, `level ${level}: third ${i + 1}`).toBeGreaterThan(0.22);
      });
    }
  });

  it('code rules: no region of the listing is ever safe to ignore', () => {
    // Some rules are positional by nature (a read before a later definition), so the spread is
    // looser here; still, every third of the code must regularly hold the bug.
    for (const { level, challenges } of byLevel) {
      const code = challenges.filter((c) => c.content.kind === 'code-rule');
      if (code.length < 40) continue;
      thirds(code).forEach((share, i) => {
        expect.soft(share, `level ${level}: third ${i + 1}`).toBeGreaterThan(0.04);
      });
    }
  });
});
