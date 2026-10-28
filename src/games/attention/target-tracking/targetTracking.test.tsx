import { act, render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { finalPosition, targetTrackingGame } from './content/definition';
import { TARGET_TRACKING_LEVELS } from './content/levels';
import { targetTrackingModule } from './index';
import { TargetTrackingView } from './ui/TargetTrackingView';

describeGameContract(targetTrackingModule);

/** Independent oracle: simulate the cups as an array of card ids. */
function simulate(slots: number, swaps: readonly (readonly [number, number])[], card: number) {
  const cups = Array.from({ length: slots }, (_, i) => i);
  for (const [a, b] of swaps) {
    const tmp = cups[a] as number;
    cups[a] = cups[b] as number;
    cups[b] = tmp;
  }
  return cups.indexOf(card);
}

/** Advances fake time in small slices so each stepper timeout re-arms between slices. */
function elapse(ms: number) {
  for (let t = 0; t < ms; t += 100) {
    act(() => {
      vi.advanceTimersByTime(100);
    });
  }
}

describe('Target Tracking', () => {
  it('asks for the true final position of a followed card', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (const seed of contractSeeds(40)) {
        const c = generateChallenge(targetTrackingGame, { level, seed });
        const { items, swaps, asked, followed } = c.content;
        if (c.response.format !== 'locate') throw new Error('locate expected');
        expect(c.response.solution.index).toBe(simulate(items.length, swaps, asked));
        expect(finalPosition(asked, swaps)).not.toBe(asked);
        expect(followed).toContain(asked);
        expect(swaps.every(([a, b]) => a !== b && a < items.length && b < items.length)).toBe(true);
      }
    }
  });

  it('adds cards, swaps and pace across levels; never faster than one swap a second', () => {
    expectNonDecreasing(TARGET_TRACKING_LEVELS, (p) => p.slots, 'slots');
    expectNonDecreasing(TARGET_TRACKING_LEVELS, (p) => p.swaps, 'swaps');
    expectNonDecreasing(TARGET_TRACKING_LEVELS, (p) => -p.stepMs, 'pace');
    for (const level of DIFFICULTY_LEVELS)
      expect(TARGET_TRACKING_LEVELS[level].stepMs).toBeGreaterThanOrEqual(1000);
  });

  it('plays the swaps, then lets the player point at a position', () => {
    vi.useFakeTimers();
    try {
      const c = generateChallenge(targetTrackingGame, { level: 3, seed: toSeed(4) });
      const onLocate = vi.fn();
      render(
        <TargetTrackingView
          challenge={c}
          phase="respond"
          locate={{ disabled: false, selectedIndex: null, solutionIndex: null, onLocate }}
          respond={null}
          answer={null}
          assisted={false}
        />,
      );
      expect(screen.getByText(/Remember the marked card/)).toBeInTheDocument();
      for (const button of screen.getAllByRole('listitem')) expect(button).toBeInTheDocument();
      expect(screen.queryAllByRole('button')).toHaveLength(0);
      elapse(c.content.revealMs + c.content.stepMs / 2);
      expect(screen.getByText(/Swap 1 of 4/)).toBeInTheDocument();
      elapse(c.content.swaps.length * c.content.stepMs + 500);
      expect(screen.getByText(/now\?$/)).toBeInTheDocument();
      if (c.response.format !== 'locate') throw new Error('locate expected');
      const { index } = c.response.solution;
      act(() => {
        screen.getAllByRole('button')[index]?.click();
      });
      expect(onLocate).toHaveBeenCalledWith(index);
    } finally {
      vi.useRealTimers();
    }
  });
});
