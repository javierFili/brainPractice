import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { en } from '@/test/i18n';
import { objectById } from '../shared/content';
import { objectRecallGame } from './content/definition';
import { OBJECT_RECALL_LEVELS } from './content/levels';
import { objectRecallModule } from './index';
import { ObjectRecallView } from './ui/ObjectRecallView';

describeGameContract(objectRecallModule);

describe('Object Recall content', () => {
  it('asks for exactly the studied objects on a board of distinct objects', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let s = 0; s < 20; s++) {
        const c = generateChallenge(objectRecallGame, { level, seed: toSeed(level * 100 + s) });
        const { studied, board } = c.content;
        const profile = OBJECT_RECALL_LEVELS[level];
        expect(new Set(board).size).toBe(board.length);
        expect(board).toHaveLength(profile.board);
        expect(studied).toHaveLength(profile.studied);
        if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
        const marked = c.response.solution.indices.map((i) => board[i]);
        expect([...marked].sort()).toEqual([...studied].sort());
        if (c.content.kind === 'family') {
          const families = new Set(board.map((id) => objectById(id).category));
          expect(families.size).toBeLessThanOrEqual(profile.families);
        }
      }
    }
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(OBJECT_RECALL_LEVELS, (p) => p.studied, 'studied');
    expectNonDecreasing(OBJECT_RECALL_LEVELS, (p) => p.board, 'board');
    expectNonDecreasing(OBJECT_RECALL_LEVELS, (p) => -(p.timing.studyMs ?? 0) / p.studied, 'pace');
  });
});

describe('Object Recall board', () => {
  it('submits the marked objects', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(objectRecallGame, { level: 1, seed: toSeed(4) });
    const respond = vi.fn();
    render(
      <ObjectRecallView
        challenge={c}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    for (const id of c.content.studied) {
      await user.click(screen.getByRole('button', { name: en(objectById(id).label) }));
    }
    await user.click(screen.getByRole('button', { name: 'Check' }));
    if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
    const sent = respond.mock.calls[0]?.[0] as { indices: number[] };
    expect([...sent.indices].sort((a, b) => a - b)).toEqual(c.response.solution.indices);
  });
});
