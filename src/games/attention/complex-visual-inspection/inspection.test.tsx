import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import type { ColorName } from '@/games/kit/content';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { markKey } from '../shared/content';
import { complexVisualInspectionGame } from './content/definition';
import { INSPECTION_LEVELS } from './content/levels';
import { complexVisualInspectionModule } from './index';
import { InspectionView } from './ui/InspectionView';

describeGameContract(complexVisualInspectionModule);

describe('Complex Visual Inspection', () => {
  it('solution = items whose look equals the rule (shape, pose, colour), with lures present', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const p = INSPECTION_LEVELS[level];
      for (const seed of contractSeeds(30)) {
        const c = generateChallenge(complexVisualInspectionGame, { level, seed });
        const { rule, items } = c.content;
        const poseKey = (color: ColorName) =>
          markKey({
            shape: rule.shape,
            color,
            rotation: rule.rotation,
            mirrored: rule.mirrored,
          });
        const expected = items.flatMap((m, i) => {
          const looksRight = markKey(m) === poseKey(m.color);
          const colorOk = rule.negated ? m.color !== rule.color : m.color === rule.color;
          return looksRight && colorOk ? [i] : [];
        });
        if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
        expect(c.response.solution.indices).toEqual(expected);
        expect(expected).toHaveLength(p.targets);
        expect(expected.length).toBeGreaterThan(c.response.question.maxErrors * 3);
        const nearMisses = items.filter(
          (m) => m.shape === rule.shape && !expected.includes(items.indexOf(m)),
        );
        expect(nearMisses.length).toBeGreaterThan(0);
      }
    }
  });

  it('gets denser and harder', () => {
    expectNonDecreasing(INSPECTION_LEVELS, (p) => p.columns * p.rows, 'cells');
    expectNonDecreasing(INSPECTION_LEVELS, (p) => p.targets, 'targets');
    expectNonDecreasing(INSPECTION_LEVELS, (p) => p.lureShare, 'lure share');
    expectNonDecreasing(INSPECTION_LEVELS, (p) => p.rotations.length, 'directions');
  });

  it('marks the matches and submits', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(complexVisualInspectionGame, { level: 5, seed: toSeed(14) });
    if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
    const respond = vi.fn();
    render(
      <InspectionView
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
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(respond).toHaveBeenCalledWith({
      format: 'multi-select',
      indices: c.response.solution.indices,
    });
  });
});
