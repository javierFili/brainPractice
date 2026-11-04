import { en } from '@/test/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectDistinctLevels } from '@/test/gameContract';
import type { TileGrid } from '../shared/content';
import { expectFastGeneration, generateMany, solutionLabel } from '../shared/testing';
import { CLASS_LABELS, symmetryGame } from './content/definition';
import { SYMMETRY_LEVELS } from './content/levels';
import type { SymmetryClass, SymmetryProfile } from './content/types';
import { symmetryModule } from './index';
import { SymmetryView } from './ui/SymmetryView';

describeGameContract(symmetryModule);

// Independent oracle: compare each cell with its mirror cell directly.
const v = (g: TileGrid, r: number, c: number) => (g[r] as number[])[c] as number;
function oracleClass(g: TileGrid): SymmetryClass {
  const rows = g.length;
  const cols = (g[0] as number[]).length;
  let lr = true;
  let tb = true;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (v(g, r, c) !== v(g, r, cols - 1 - c)) lr = false;
      if (v(g, r, c) !== v(g, rows - 1 - r, c)) tb = false;
    }
  return lr && tb ? 'both' : lr ? 'left-right' : tb ? 'top-bottom' : 'none';
}

describe('Symmetry Recognition', () => {
  const all = generateMany(symmetryGame);

  it('names the exact mirror lines, and the answers are spread evenly', () => {
    const counts = new Map<string, number>();
    for (const { challenge } of all) {
      if (challenge.content.kind !== 'classify') continue;
      const truth = oracleClass(challenge.content.grid);
      expect(solutionLabel(challenge)).toBe(en(CLASS_LABELS[truth]));
      counts.set(truth, (counts.get(truth) ?? 0) + 1);
    }
    const values = [...counts.values()];
    expect(Math.min(...values) / Math.max(...values)).toBeGreaterThan(0.4);
  });

  it('asks to mark exactly the cells that make the whole picture symmetric', () => {
    for (const { challenge } of all) {
      const { content, response } = challenge;
      if (content.kind !== 'complete' || response.format !== 'multi-select') continue;
      const { given, axis } = content;
      const rows = given.length;
      const cols = (given[0] as number[]).length;
      const marked = new Set(response.solution.indices);
      const half = Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (__, c) => (marked.has(r * cols + c) ? 1 : 0)),
      );
      const whole =
        axis === 'vertical'
          ? given.map((row, r) => [...row, ...(half[r] as number[])])
          : [...given, ...half];
      const truth = oracleClass(whole);
      expect(
        truth === 'both' || truth === (axis === 'vertical' ? 'left-right' : 'top-bottom'),
      ).toBe(true);
      // Copying the half without mirroring it would be wrong.
      expect(JSON.stringify(half)).not.toBe(JSON.stringify(given));
    }
  });

  it('grows the grids and the choices across levels', () => {
    // Two interleaved tracks (spotting, drawing): each grows on its own.
    const track = (kind: 'classify' | 'complete', key: (p: SymmetryProfile) => number) => {
      const values = DIFFICULTY_LEVELS.map((l) => SYMMETRY_LEVELS[l])
        .filter((p) => p.kind === kind)
        .map(key);
      expect(values).toEqual([...values].sort((x, y) => x - y));
    };
    track('classify', (p) => p.rows * p.cols);
    track('classify', (p) => p.tiles);
    track('classify', (p) => p.classes.length);
    track('complete', (p) => p.rows * p.cols);
    track('complete', (p) => p.axes.length);
    track('complete', (p) => (p.announceCount ? 0 : 1));
    expectDistinctLevels(SYMMETRY_LEVELS);
  });

  it('generates quickly', () => {
    expectFastGeneration(symmetryGame);
  });

  it('submits the marked mirror cells from the board', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(symmetryGame, { level: 2, seed: toSeed(5) });
    if (c.content.kind !== 'complete' || c.response.format !== 'multi-select')
      throw new Error('complete expected');
    const respond = vi.fn();
    render(
      <SymmetryView
        challenge={c}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    const cols = (c.content.given[0] as number[]).length;
    for (const index of c.response.solution.indices) {
      const name = `row ${Math.floor(index / cols) + 1}, column ${(index % cols) + cols + 1}`;
      await user.click(screen.getByRole('button', { name }));
    }
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(respond).toHaveBeenCalledTimes(1);
    const [[answer]] = respond.mock.calls as [[{ format: string; indices: number[] }]];
    expect(answer.format).toBe('multi-select');
    expect([...answer.indices].sort((a, b) => a - b)).toEqual(c.response.solution.indices);
  });
});
