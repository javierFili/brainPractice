import { act, fireEvent, render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { sustainedAttentionGame } from './content/definition';
import { SUSTAINED_ATTENTION_LEVELS } from './content/levels';
import { sustainedAttentionModule } from './index';
import { SustainedAttentionView } from './ui/SustainedAttentionView';

describeGameContract(sustainedAttentionModule);

function elapse(ms: number) {
  for (let t = 0; t < ms; t += 100) {
    act(() => {
      vi.advanceTimersByTime(100);
    });
  }
}

describe('Sustained Attention Challenge', () => {
  it('targets are exactly the X (after an A) positions; no letter repeats', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const p = SUSTAINED_ATTENTION_LEVELS[level];
      for (const seed of contractSeeds(30)) {
        const c = generateChallenge(sustainedAttentionGame, { level, seed });
        const { stream, cue } = c.content;
        const expected = stream.flatMap((l, i) =>
          l === 'X' && (cue === null || stream[i - 1] === 'A') ? [i] : [],
        );
        if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
        expect(c.response.solution.indices).toEqual(expected);
        expect(stream).toHaveLength(p.length);
        expect(stream.every((l, i) => i === 0 || l !== stream[i - 1])).toBe(true);
        // Doing nothing never passes.
        expect(expected.length).toBeGreaterThan(c.response.question.maxErrors * 3);
        if (cue !== null) {
          // There are lures: an X without the cue or a cue without the X.
          const lures = stream.filter(
            (l, i) => (l === 'X' && stream[i - 1] !== 'A') || (l === 'A' && stream[i + 1] !== 'X'),
          );
          expect(lures.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('lengthens the stream; pace never under 700 ms per letter', () => {
    expectNonDecreasing(SUSTAINED_ATTENTION_LEVELS, (p) => p.length, 'length');
    expectNonDecreasing(SUSTAINED_ATTENTION_LEVELS, (p) => -p.itemMs, 'pace');
    for (const level of DIFFICULTY_LEVELS)
      expect(SUSTAINED_ATTENTION_LEVELS[level].itemMs).toBeGreaterThanOrEqual(700);
  });

  it('records presses on the letters shown and submits them when the stream ends', () => {
    vi.useFakeTimers();
    try {
      const c = generateChallenge(sustainedAttentionGame, { level: 5, seed: toSeed(21) });
      if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
      const targets = new Set(c.response.solution.indices);
      const respond = vi.fn();
      render(
        <SustainedAttentionView
          challenge={c}
          phase="respond"
          locate={null}
          respond={respond}
          answer={null}
          assisted={false}
        />,
      );
      expect(screen.getByText('Get ready…')).toBeInTheDocument();
      elapse(c.content.itemMs);
      c.content.stream.forEach((letter, i) => {
        expect(screen.getByText(letter)).toBeInTheDocument();
        if (targets.has(i)) {
          fireEvent.keyDown(window, { key: ' ' });
          fireEvent.keyDown(window, { key: ' ' }); // a second press on the same letter is ignored
        }
        elapse(c.content.itemMs);
      });
      expect(respond).toHaveBeenCalledTimes(1);
      expect(respond).toHaveBeenCalledWith({ format: 'multi-select', indices: [...targets] });
    } finally {
      vi.useRealTimers();
    }
  });
});
