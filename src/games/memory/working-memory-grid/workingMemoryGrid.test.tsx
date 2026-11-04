import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { en } from '@/test/i18n';
import { cellName } from '../shared/content';
import { workingMemoryGridGame } from './content/definition';
import { WORKING_GRID_LEVELS } from './content/levels';
import { workingMemoryGridModule } from './index';
import { WorkingGridView } from './ui/WorkingGridView';

describeGameContract(workingMemoryGridModule);

describe('Working Memory Grid content', () => {
  it('asks for the last K distinct lights or the light N steps before the last', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const profile = WORKING_GRID_LEVELS[level];
      for (let s = 0; s < 40; s++) {
        const c = generateChallenge(workingMemoryGridGame, {
          level,
          seed: toSeed(level * 900 + s),
        });
        const { stream, depth, kind, size } = c.content;
        expect(stream.length).toBeGreaterThanOrEqual(profile.stream[0]);
        expect(stream.length).toBeLessThanOrEqual(profile.stream[1]);
        for (let i = 1; i < stream.length; i++) expect(stream[i]).not.toBe(stream[i - 1]);
        expect(Math.max(...stream)).toBeLessThan(size * size);
        expect(c.timing.studyMs).toBeGreaterThanOrEqual(stream.length * c.content.itemMs);
        // Independent oracle: walk the stream keeping a window of recent lights.
        const window: number[] = [];
        for (const cell of stream) {
          window.push(cell);
          if (window.length > depth + 1) window.shift();
        }
        if (kind === 'last-k') {
          if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
          const lastK = window.slice(-depth);
          expect(new Set(lastK).size).toBe(depth);
          expect(c.response.solution.indices).toEqual([...lastK].sort((a, b) => a - b));
        } else {
          if (c.response.format !== 'locate') throw new Error('locate expected');
          expect(c.response.solution.index).toBe(window[0]);
          expect(window[0]).not.toBe(window.at(-1));
        }
      }
    }
  });

  it('raises size, stream length and depth across levels', () => {
    expectNonDecreasing(WORKING_GRID_LEVELS, (p) => p.size, 'size');
    expectNonDecreasing(WORKING_GRID_LEVELS, (p) => p.stream[1], 'stream');
    expectNonDecreasing(WORKING_GRID_LEVELS, (p) => p.lastK, 'lastK');
    expectNonDecreasing(WORKING_GRID_LEVELS, (p) => p.nBack, 'nBack');
    expectNonDecreasing(WORKING_GRID_LEVELS, (p) => -p.itemMs, 'pace');
  });
});

describe('Working Memory Grid view', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows one light at a time with a dark gap between lights', () => {
    vi.useFakeTimers();
    const c = generateChallenge(workingMemoryGridGame, { level: 1, seed: toSeed(3) });
    const { stream, itemMs } = c.content;
    render(
      <WorkingGridView
        challenge={c}
        phase="study"
        locate={null}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    const lit = () =>
      screen
        .queryAllByRole('listitem')
        .filter((el) => /, lit$/.test(el.getAttribute('aria-label') ?? ''));
    expect(lit()).toHaveLength(1);
    expect(lit()[0]).toHaveAccessibleName(`${en(cellName(stream[0] as number, 3))}, lit`);
    act(() => {
      vi.advanceTimersByTime(itemMs / 2);
    });
    expect(lit()).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(itemMs / 2);
    });
    expect(lit()[0]).toHaveAccessibleName(`${en(cellName(stream[1] as number, 3))}, lit`);
  });

  it('submits the marked last lights', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(workingMemoryGridGame, { level: 1, seed: toSeed(5) });
    if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
    const respond = vi.fn();
    render(
      <WorkingGridView
        challenge={c}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    for (const i of c.response.solution.indices) {
      await user.click(screen.getByRole('button', { name: en(cellName(i, 3)) }));
    }
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(respond).toHaveBeenCalledWith({
      format: 'multi-select',
      indices: expect.arrayContaining([...c.response.solution.indices]) as unknown,
    });
  });
});
