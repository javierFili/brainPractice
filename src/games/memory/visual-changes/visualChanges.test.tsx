import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { glyphKey, type Glyph } from '@/games/kit/content';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { cellName } from '../shared/content';
import { differences, visualChangesGame } from './content/definition';
import { VISUAL_CHANGES_LEVELS } from './content/levels';
import { visualChangesModule } from './index';
import { VisualChangesView } from './ui/VisualChangesView';

describeGameContract(visualChangesModule);

const key = (g: Glyph | null) => (g === null ? '-' : glyphKey(g));

describe('Visual Changes content', () => {
  it('changes exactly one item (or swaps two different ones) and asks for it', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let s = 0; s < 40; s++) {
        const c = generateChallenge(visualChangesGame, { level, seed: toSeed(level * 300 + s) });
        const { before, after, kind, changed } = c.content;
        expect(before.filter((g) => g !== null)).toHaveLength(VISUAL_CHANGES_LEVELS[level].items);
        expect(differences(before, after)).toEqual(changed);
        if (kind === 'swap') {
          const [a, b] = changed as [number, number];
          expect(key(after[a] ?? null)).toBe(key(before[b] ?? null));
          expect(key(after[b] ?? null)).toBe(key(before[a] ?? null));
          if (c.response.format !== 'multi-select') throw new Error('multi-select expected');
          expect(c.response.solution.indices).toEqual(changed);
        } else {
          expect(changed).toHaveLength(1);
          const i = changed[0] as number;
          const was = before[i] as Glyph;
          const now = after[i] as Glyph;
          expect(kind === 'color' ? was.shape === now.shape : was.color === now.color).toBe(true);
          if (c.response.format !== 'locate') throw new Error('locate expected');
          expect(c.response.solution.index).toBe(i);
        }
      }
    }
  });

  it('places the change uniformly across the items', () => {
    const hits = new Map<number, number>();
    for (let s = 0; s < 400; s++) {
      const c = generateChallenge(visualChangesGame, { level: 1, seed: toSeed(s) });
      const filled = c.content.before.flatMap((g, i) => (g === null ? [] : [i]));
      const rank = filled.indexOf(c.content.changed[0] as number);
      hits.set(rank, (hits.get(rank) ?? 0) + 1);
    }
    for (const rank of [0, 1, 2, 3]) expect(hits.get(rank) ?? 0).toBeGreaterThan(60);
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(VISUAL_CHANGES_LEVELS, (p) => p.items, 'items');
    expectNonDecreasing(VISUAL_CHANGES_LEVELS, (p) => p.size, 'size');
    expectNonDecreasing(VISUAL_CHANGES_LEVELS, (p) => Object.keys(p.kinds).length, 'kinds');
  });
});

describe('Visual Changes view', () => {
  it('reports the pressed cell through locate', async () => {
    const user = userEvent.setup();
    const c = generateChallenge(visualChangesGame, { level: 1, seed: toSeed(1) });
    const onLocate = vi.fn();
    render(
      <VisualChangesView
        challenge={c}
        phase="respond"
        locate={{ disabled: false, selectedIndex: null, solutionIndex: null, onLocate }}
        respond={() => undefined}
        answer={null}
        assisted={false}
      />,
    );
    const i = c.content.changed[0] as number;
    await user.click(screen.getByRole('button', { name: new RegExp(`^${cellName(i, 3)},`) }));
    expect(onLocate).toHaveBeenCalledWith(i);
  });

  it('submits both swapped cells', async () => {
    const user = userEvent.setup();
    let seed = 0;
    let c = generateChallenge(visualChangesGame, { level: 7, seed: toSeed(seed) });
    while (c.content.kind !== 'swap')
      c = generateChallenge(visualChangesGame, { level: 7, seed: toSeed(++seed) });
    const respond = vi.fn();
    render(
      <VisualChangesView
        challenge={c}
        phase="respond"
        locate={null}
        respond={respond}
        answer={null}
        assisted={false}
      />,
    );
    for (const i of c.content.changed) {
      await user.click(screen.getByRole('button', { name: new RegExp(`^${cellName(i, 5)},`) }));
    }
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(respond).toHaveBeenCalledWith({
      format: 'multi-select',
      indices: [...c.content.changed],
    });
  });
});
