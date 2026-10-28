import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { positionMemoryGame } from './content/definition';
import { POSITION_MEMORY_LEVELS } from './content/levels';
import { positionMemoryModule } from './index';
import { PositionMemoryView } from './ui/PositionMemoryView';

describeGameContract(positionMemoryModule);

describe('Position Memory', () => {
  it('lights distinct cells and asks only for the targets', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const c = generateChallenge(positionMemoryGame, { level, seed: toSeed(level) });
      const { targets, distractors, size } = c.content;
      expect(new Set([...targets, ...distractors]).size).toBe(targets.length + distractors.length);
      expect(Math.max(...targets, ...distractors)).toBeLessThan(size * size);
      if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
      expect(c.response.solution.indices).toEqual(targets);
    }
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(POSITION_MEMORY_LEVELS, (p) => p.targets, 'targets');
    expectNonDecreasing(POSITION_MEMORY_LEVELS, (p) => p.size, 'size');
  });

  it('marks cells and submits only the announced number of marks', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(positionMemoryGame, { level: 2, seed: toSeed(9) });
    const respond = vi.fn();
    render(
      <PositionMemoryView
        challenge={c}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    const check = screen.getByRole('button', { name: 'Check' });
    expect(check).toBeDisabled();
    for (const index of c.content.targets) {
      await user.click(
        screen.getByRole('button', {
          name: new RegExp(`^row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}$`),
        }),
      );
    }
    expect(screen.getByText('3 of 3 marked')).toBeInTheDocument();
    await user.click(check);
    expect(respond).toHaveBeenCalledWith({ format: 'multi-select', indices: c.content.targets });
  });
});
