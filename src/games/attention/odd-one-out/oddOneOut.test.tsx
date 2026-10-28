import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { markKey } from '../shared/content';
import { oddOneOutGame } from './content/definition';
import { ODD_ONE_OUT_LEVELS } from './content/levels';
import { oddOneOutModule } from './index';
import { OddOneOutView } from './ui/OddOneOutView';

describeGameContract(oddOneOutModule);

describe('Odd One Out', () => {
  it('has exactly one item that looks different, and it is the solution', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(40)) {
        const c = generateChallenge(oddOneOutGame, { level, seed });
        const keys = c.content.items.map(markKey);
        const odd = keys.filter((k) => keys.filter((other) => other === k).length === 1);
        expect(odd).toHaveLength(1);
        expect(new Set(keys).size).toBe(2);
        if (c.response.format !== 'locate') throw new Error('locate expected');
        expect(keys[c.response.solution.index]).toBe(odd[0]);
        expect(c.content.items).toHaveLength(c.response.question.itemCount);
      }
    }
  });

  it('grows the grid across levels', () => {
    expectNonDecreasing(ODD_ONE_OUT_LEVELS, (p) => p.columns * p.rows, 'cells');
    expectNonDecreasing(ODD_ONE_OUT_LEVELS, (p) => p.columns, 'columns');
  });

  it('gives each cell a name that tells the odd one apart', async () => {
    const c = generateChallenge(oddOneOutGame, { level: 8, seed: toSeed(5) });
    const onLocate = vi.fn();
    render(
      <OddOneOutView
        challenge={c}
        phase="respond"
        locate={{ disabled: false, selectedIndex: null, solutionIndex: null, onLocate }}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    const names = screen
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label')?.replace(/^row \d+, column \d+, /, ''));
    expect(new Set(names).size).toBe(2);
    await userEvent.setup().click(screen.getAllByRole('button')[0] as HTMLElement);
    expect(onLocate).toHaveBeenCalledWith(0);
  });
});
