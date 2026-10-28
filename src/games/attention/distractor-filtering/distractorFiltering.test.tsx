import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { distractorFilteringGame } from './content/definition';
import { DISTRACTOR_FILTERING_LEVELS } from './content/levels';
import { distractorFilteringModule } from './index';
import { DistractorFilteringView } from './ui/DistractorFilteringView';

describeGameContract(distractorFilteringModule);

describe('Distractor Filtering', () => {
  it('solution = exactly the items matching the rule, with the planned count', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const profile = DISTRACTOR_FILTERING_LEVELS[level];
      for (const seed of contractSeeds(30)) {
        const c = generateChallenge(distractorFilteringGame, { level, seed });
        const { items, target, kind } = c.content;
        const expected = items.flatMap((m, i) => {
          const shape = m.shape === target.shape;
          const color = m.color === target.color;
          const hit = kind === 'shape' ? shape : kind === 'color' ? color : shape && color;
          return hit ? [i] : [];
        });
        if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
        expect(c.response.solution.indices).toEqual(expected);
        expect(expected).toHaveLength(profile.targets);
        // Tolerance never lets an empty answer pass.
        expect(expected.length).toBeGreaterThan(c.response.question.maxErrors * 3);
      }
    }
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(DISTRACTOR_FILTERING_LEVELS, (p) => p.columns * p.rows, 'cells');
    expectNonDecreasing(DISTRACTOR_FILTERING_LEVELS, (p) => p.similarity, 'similarity');
    expectNonDecreasing(DISTRACTOR_FILTERING_LEVELS, (p) => (p.exact ? 0 : 1), 'hidden count');
  });

  it('submits the marked targets without a fixed count at high levels', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(distractorFilteringGame, { level: 8, seed: toSeed(3) });
    if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
    const respond = vi.fn();
    render(
      <DistractorFilteringView
        challenge={c}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    const cells = screen.getAllByRole('button', { name: /^row / });
    for (const i of c.response.solution.indices) await user.click(cells[i] as HTMLElement);
    expect(screen.getByText(`${c.response.solution.indices.length} marked`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(respond).toHaveBeenCalledWith({
      format: 'multi-select',
      indices: c.response.solution.indices,
    });
  });
});
