import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { algorithmicReasoningGame } from './content/definition';
import { ROBOT_LEVELS } from './content/levels';
import type { Instruction, RobotContent } from './content/types';
import { algorithmicReasoningModule } from './index';
import { RobotView } from './ui/RobotView';

describeGameContract(algorithmicReasoningModule);

/** Independent interpreter using (row, col, dx, dy) instead of cell indices. */
function oracle(content: RobotContent): number {
  const { size, walls } = content;
  let r = Math.floor(content.start.cell / size);
  let c = content.start.cell % size;
  let d = content.start.facing;
  const moves = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ] as const;
  const free = (rr: number, cc: number) =>
    rr >= 0 && rr < size && cc >= 0 && cc < size && !walls.includes(rr * size + cc);
  const front = () => [r + moves[d][0], c + moves[d][1]] as const;
  const exec = (list: readonly Instruction[]) => {
    for (const ins of list) {
      if (ins.type === 'forward')
        for (let i = 0; i < ins.steps; i++) {
          const [nr, nc] = front();
          if (!free(nr, nc)) throw new Error('walked into a wall');
          [r, c] = [nr, nc];
        }
      else if (ins.type === 'turn')
        d = ((d + (ins.turn === 'right' ? 1 : ins.turn === 'left' ? 3 : 2)) % 4) as typeof d;
      else if (ins.type === 'repeat') for (let i = 0; i < ins.times; i++) exec(ins.body);
      else if (ins.type === 'if-blocked') exec(free(...front()) ? ins.otherwise : ins.then);
      else while (free(...front())) [r, c] = front();
    }
  };
  exec(content.program);
  return r * size + c;
}

describe('Algorithmic Reasoning', () => {
  it('the asked square matches an independent interpreter', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(20, 41)) {
        const c = generateChallenge(algorithmicReasoningGame, { level, seed });
        if (c.response.format !== 'locate') throw new Error('locate expected');
        const end = oracle(c.content);
        expect(c.response.solution.index).toBe(end);
        expect(end).not.toBe(c.content.start.cell);
        expect(c.content.walls).not.toContain(end);
      }
    }
  });

  it('grows grids and programs across levels', () => {
    expectNonDecreasing(ROBOT_LEVELS, (p) => p.size, 'size');
    expectNonDecreasing(ROBOT_LEVELS, (p) => p.walls, 'walls');
    expectNonDecreasing(ROBOT_LEVELS, (p) => p.length, 'length');
  });

  it('pressing a square locates it', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(algorithmicReasoningGame, { level: 1, seed: toSeed(3) });
    const onLocate = vi.fn();
    render(
      <RobotView
        challenge={c}
        phase="respond"
        locate={{ disabled: false, selectedIndex: null, solutionIndex: null, onLocate }}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    if (c.response.format !== 'locate') throw new Error('locate expected');
    const end = c.response.solution.index;
    const row = Math.floor(end / c.content.size) + 1;
    const col = (end % c.content.size) + 1;
    await user.click(
      screen.getByRole('button', { name: new RegExp(`^row ${row}, column ${col}`) }),
    );
    expect(onLocate).toHaveBeenCalledWith(end);
  });
});
