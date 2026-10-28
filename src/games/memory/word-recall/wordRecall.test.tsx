import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { groupOf } from '@/games/kit/content';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { wordRecallGame } from './content/definition';
import { WORD_RECALL_LEVELS } from './content/levels';
import { wordRecallModule } from './index';
import { WordRecallView } from './ui/WordRecallView';

describeGameContract(wordRecallModule);

describe('Word Recall content', () => {
  it('asks for exactly the studied words, or their order', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let s = 0; s < 30; s++) {
        const c = generateChallenge(wordRecallGame, { level, seed: toSeed(level * 500 + s) });
        const { studied, board, kind } = c.content;
        expect(new Set(studied).size).toBe(studied.length);
        expect(c.timing.studyMs).toBeGreaterThanOrEqual(studied.length * c.content.itemMs);
        if (kind === 'order') {
          if (c.response.format !== 'ordering') throw new Error('ordering expected');
          expect(c.response.solution.order).toEqual(studied);
          expect(c.response.question.items.map((i) => i.id)).not.toEqual(studied);
          continue;
        }
        if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
        expect(new Set(board).size).toBe(board.length);
        const marked = c.response.solution.indices.map((i) => board[i]);
        expect([...marked].sort()).toEqual([...studied].sort());
        if (kind === 'similar') {
          const variant = WORD_RECALL_LEVELS[level].variants.find((v) => v.kind === 'similar');
          expect(new Set(board.map(groupOf)).size).toBeLessThanOrEqual(variant?.themes ?? 0);
        }
      }
    }
  });

  it('lengthens lists and speeds them up across levels', () => {
    const most = (p: (typeof WORD_RECALL_LEVELS)[1]) => Math.max(...p.variants.map((v) => v.words));
    expectNonDecreasing(WORD_RECALL_LEVELS, most, 'words');
    expectNonDecreasing(WORD_RECALL_LEVELS, (p) => -p.itemMs, 'pace');
  });
});

describe('Word Recall view', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the words one at a time during study', () => {
    vi.useFakeTimers();
    const c = generateChallenge(wordRecallGame, { level: 1, seed: toSeed(2) });
    render(
      <WordRecallView
        challenge={c}
        phase="study"
        locate={null}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    const [first, second] = c.content.studied as [string, string];
    expect(screen.getByText(first)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(c.content.itemMs);
    });
    expect(screen.queryByText(first)).not.toBeInTheDocument();
    expect(screen.getByText(second)).toBeInTheDocument();
  });

  it('accepts one slip on tolerant boards', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(wordRecallGame, { level: 6, seed: toSeed(8) });
    if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
    expect(c.response.question).toMatchObject({ exactCount: null, maxErrors: 1 });
    const respond = vi.fn();
    render(
      <WordRecallView
        challenge={c}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    for (const word of c.content.studied.slice(1)) {
      await user.click(screen.getByRole('button', { name: word }));
    }
    await user.click(screen.getByRole('button', { name: 'Check' }));
    const sent = respond.mock.calls[0]?.[0] as { indices: number[] };
    expect(sent.indices).toHaveLength(c.content.studied.length - 1);
  });
});
