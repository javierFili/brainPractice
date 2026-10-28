import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { markKey } from '../shared/content';
import { visualDifferenceGame } from './content/definition';
import { VISUAL_DIFFERENCE_LEVELS } from './content/levels';
import { visualDifferenceModule } from './index';
import { VisualDifferenceView } from './ui/VisualDifferenceView';

describeGameContract(visualDifferenceModule);

describe('Visual Difference', () => {
  it('differs in exactly the announced cells (independent comparison)', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(30)) {
        const c = generateChallenge(visualDifferenceGame, { level, seed });
        const { left, right } = c.content;
        const differing = left.flatMap((m, i) => {
          const other = right[i];
          return other !== undefined && markKey(m) !== markKey(other) ? [i] : [];
        });
        if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
        expect(c.response.solution.indices).toEqual(differing);
        expect(c.response.question.exactCount).toBe(VISUAL_DIFFERENCE_LEVELS[level].differences);
      }
    }
  });

  it('raises size and number of differences', () => {
    expectNonDecreasing(VISUAL_DIFFERENCE_LEVELS, (p) => p.columns, 'columns');
    expectNonDecreasing(VISUAL_DIFFERENCE_LEVELS, (p) => p.differences, 'differences');
    expectNonDecreasing(VISUAL_DIFFERENCE_LEVELS, (p) => p.palette, 'palette');
  });

  it('marks the differences on the right picture and submits them', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(visualDifferenceGame, { level: 3, seed: toSeed(12) });
    if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
    const respond = vi.fn();
    render(
      <VisualDifferenceView
        challenge={c}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    const rightCells = screen.getAllByRole('button', { name: /^right, / });
    expect(rightCells).toHaveLength(16);
    for (const i of c.response.solution.indices) await user.click(rightCells[i] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(respond).toHaveBeenCalledWith({
      format: 'multi-select',
      indices: c.response.solution.indices,
    });
  });
});
