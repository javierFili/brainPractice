import { act, render, screen } from '@testing-library/react';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { choiceItems, centroidRate, chanceRate } from '@/test/guessability';
import { contractSeeds, describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { dualTaskGame } from './content/definition';
import { DUAL_TASK_LEVELS } from './content/levels';
import { dualTaskModule } from './index';
import { DualTaskView } from './ui/DualTaskView';

describeGameContract(dualTaskModule);

const counts = (label: string) => label.split(' · ').map((part) => Number.parseInt(part, 10));

describe('Dual-Task Attention', () => {
  const all = DIFFICULTY_LEVELS.flatMap((level) =>
    contractSeeds(40).map((seed) => generateChallenge(dualTaskGame, { level, seed })),
  );

  it('the correct option has both true counts; options form a 2×2 of candidates', () => {
    for (const c of all) {
      const { items, numberRule, threshold, shape, color } = c.content;
      const numbers = items.filter((i) =>
        numberRule === 'even'
          ? i.number % 2 === 0
          : numberRule === 'odd'
            ? i.number % 2 !== 0
            : i.number > threshold,
      ).length;
      const shapes = items.filter(
        (i) => i.mark.shape === shape && (color === null || i.mark.color === color),
      ).length;
      const { response } = c;
      if (response.format !== 'single-choice') throw new Error('single-choice expected');
      const { options } = response.question;
      const right = options.find((o) => o.id === response.solution.optionId);
      expect(counts(right?.label ?? '')).toEqual([numbers, shapes]);
      expect(options).toHaveLength(4);
      expect(new Set(options.map((o) => counts(o.label)[0])).size).toBe(2);
      expect(new Set(options.map((o) => counts(o.label)[1])).size).toBe(2);
    }
  });

  it('cannot be beaten by picking the central option', () => {
    const items = choiceItems(all);
    const distance = (a: string, b: string) => {
      const [x1 = 0, y1 = 0] = counts(a);
      const [x2 = 0, y2 = 0] = counts(b);
      return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    };
    expect(centroidRate(items, distance)).toBeLessThan(chanceRate(items) * 1.3);
  });

  it('lengthens the stream and speeds up within safe limits', () => {
    expectNonDecreasing(DUAL_TASK_LEVELS, (p) => p.length, 'length');
    expectNonDecreasing(DUAL_TASK_LEVELS, (p) => -p.itemMs, 'pace');
    expectNonDecreasing(DUAL_TASK_LEVELS, (p) => -p.spacing, 'option spacing');
  });

  it('plays the pairs one by one in the study phase', () => {
    vi.useFakeTimers();
    try {
      const c = generateChallenge(dualTaskGame, { level: 1, seed: toSeed(6) });
      render(
        <DualTaskView
          challenge={c}
          phase="study"
          locate={null}
          respond={null}
          answer={null}
          assisted={false}
        />,
      );
      expect(screen.getByText('Get ready…')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(c.content.itemMs);
      });
      const first = c.content.items[0];
      expect(screen.getByText(String(first?.number))).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
