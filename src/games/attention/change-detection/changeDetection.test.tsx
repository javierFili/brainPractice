import { act, render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { markKey } from '../shared/content';
import { YES, changeDetectionGame } from './content/definition';
import { CHANGE_DETECTION_LEVELS } from './content/levels';
import { changeDetectionModule } from './index';
import { ChangeDetectionView } from './ui/ChangeDetectionView';

describeGameContract(changeDetectionModule);

const key = (cell: Parameters<typeof markKey>[0] | null) => (cell === null ? '-' : markKey(cell));

describe('Change Detection', () => {
  it('answers yes exactly when the two looks differ, and is balanced', () => {
    let yes = 0;
    let total = 0;
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(40)) {
        const c = generateChallenge(changeDetectionGame, { level, seed });
        const differs = c.content.before.some(
          (cell, i) => key(cell) !== key(c.content.after[i] ?? null),
        );
        if (c.response.format !== 'single-choice') throw new Error('single-choice expected');
        expect(c.response.solution.optionId === YES).toBe(differs);
        expect(c.content.kind === 'none').toBe(!differs);
        if (differs) yes++;
        total++;
      }
    }
    expect(yes / total).toBeGreaterThan(0.4);
    expect(yes / total).toBeLessThan(0.6);
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(CHANGE_DETECTION_LEVELS, (p) => p.items, 'items');
    expectNonDecreasing(CHANGE_DETECTION_LEVELS, (p) => -(p.timing.studyMs ?? 0), 'exposure');
  });

  it('shows a blank board before the second look', () => {
    vi.useFakeTimers();
    try {
      const c = generateChallenge(changeDetectionGame, { level: 4, seed: toSeed(8) });
      render(
        <ChangeDetectionView
          challenge={c}
          phase="respond"
          locate={null}
          respond={() => undefined}
          answer={null}
          assisted={false}
        />,
      );
      expect(screen.getByRole('list', { name: 'Blank board' })).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(c.content.gapMs + 10);
      });
      expect(screen.getByRole('list', { name: 'Second look' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
