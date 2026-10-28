import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { sameGlyph } from '@/games/kit/content';
import { meanGenerationMs, sweep } from '@/games/speed/shared/testing';
import {
  describeGameContract,
  expectDistinctLevels,
  expectNonDecreasing,
} from '@/test/gameContract';
import { visualSearchSprintGame } from './content/definition';
import { VISUAL_SEARCH_LEVELS } from './content/levels';
import { visualSearchSprintModule } from './index';
import { VisualSearchView } from './ui/VisualSearchView';

describeGameContract(visualSearchSprintModule);

const all = sweep(visualSearchSprintGame, 40);

describe('Visual Search Sprint content', () => {
  it('hides exactly one target, at the solution index', () => {
    for (const { level, challenge } of all) {
      const { cells, target, columns } = challenge.content;
      if (challenge.response.format !== 'locate') throw new Error('locate expected');
      const matches = cells.flatMap((g, i) => (sameGlyph(g, target) ? [i] : []));
      expect(matches).toEqual([challenge.response.solution.index]);
      expect(cells).toHaveLength(VISUAL_SEARCH_LEVELS[level].setSize);
      expect(columns).toBeLessThanOrEqual(6);
    }
  });

  it('makes feature trials solvable by shape and conjunction trials need both features', () => {
    for (const { challenge } of all) {
      const { cells, target, kind } = challenge.content;
      const others = cells.filter((g) => !sameGlyph(g, target));
      if (kind === 'conjunction') {
        expect(others.some((g) => g.shape === target.shape)).toBe(true);
        expect(others.some((g) => g.color === target.color)).toBe(true);
        expect(others.every((g) => g.shape === target.shape || g.color === target.color)).toBe(
          true,
        );
      } else {
        expect(others.every((g) => g.color === target.color && g.shape !== target.shape)).toBe(
          true,
        );
        expect(new Set(others.map((g) => g.shape)).size).toBe(1);
      }
    }
  });

  it('places the target uniformly', () => {
    const level10 = all.filter((e) => e.level === 1).map((e) => e.challenge);
    const extra = Array.from({ length: 400 }, (_, s) =>
      generateChallenge(visualSearchSprintGame, { level: 1, seed: toSeed(1000 + s) }),
    );
    const counts = Array.from({ length: 9 }, () => 0);
    for (const c of [...level10, ...extra]) {
      if (c.response.format === 'locate')
        counts[c.response.solution.index] = (counts[c.response.solution.index] ?? 0) + 1;
    }
    for (const count of counts) expect(count).toBeGreaterThan(20);
  });

  it('grows the grid across levels and keeps levels distinct', () => {
    expectNonDecreasing(VISUAL_SEARCH_LEVELS, (p) => p.setSize, 'setSize');
    expectNonDecreasing(VISUAL_SEARCH_LEVELS, (p) => p.timing.targetMs, 'targetMs');
    expectDistinctLevels(VISUAL_SEARCH_LEVELS);
  });

  it('generates quickly', () => {
    expect(meanGenerationMs(visualSearchSprintGame)).toBeLessThan(5);
  });
});

describe('Visual Search view', () => {
  const challenge = generateChallenge(visualSearchSprintGame, { level: 5, seed: toSeed(9) });
  const solution = challenge.response.format === 'locate' ? challenge.response.solution.index : -1;

  it('reports the pressed cell through the locate binding', async () => {
    const onLocate = vi.fn();
    render(
      <VisualSearchView
        challenge={challenge}
        phase="respond"
        locate={{ disabled: false, selectedIndex: null, solutionIndex: null, onLocate }}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(challenge.content.cells.length);
    const cell = cells[solution];
    if (cell === undefined) throw new Error('missing cell');
    await userEvent.click(cell);
    expect(onLocate).toHaveBeenCalledWith(solution);
  });

  it('marks the target and a wrong pick with words in review', () => {
    const wrong = solution === 0 ? 1 : 0;
    render(
      <VisualSearchView
        challenge={challenge}
        phase="review"
        locate={{
          disabled: true,
          selectedIndex: wrong,
          solutionIndex: solution,
          onLocate: vi.fn(),
        }}
        respond={null}
        answer={{ format: 'locate', index: wrong }}
        assisted={false}
      />,
    );
    expect(screen.getByRole('button', { name: /, target, correct$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /your pick, wrong$/ })).toBeInTheDocument();
  });
});
