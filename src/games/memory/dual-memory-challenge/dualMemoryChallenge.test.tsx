import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { generateChallenge } from '@/domain/game';
import { toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { en } from '@/test/i18n';
import { cellName, objectById } from '../shared/content';
import { dualMemoryGame } from './content/definition';
import { DUAL_MEMORY_LEVELS } from './content/levels';
import { dualMemoryChallengeModule } from './index';
import { DualMemoryView } from './ui/DualMemoryView';

describeGameContract(dualMemoryChallengeModule);

describe('Dual Memory Challenge content', () => {
  it('answers each probe from the placements, with distinct objects and cells', () => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let s = 0; s < 40; s++) {
        const c = generateChallenge(dualMemoryGame, { level, seed: toSeed(level * 400 + s) });
        const { placements, ask, kind, size } = c.content;
        expect(placements).toHaveLength(DUAL_MEMORY_LEVELS[level].objects);
        expect(new Set(placements.map((p) => p.cell)).size).toBe(placements.length);
        expect(new Set(placements.map((p) => p.objectId)).size).toBe(placements.length);
        const target = placements[ask];
        if (!target) throw new Error('asked placement missing');
        if (kind === 'where' || kind === 'where-nth') {
          if (c.response.format !== 'locate') throw new Error('locate expected');
          expect(c.response.solution.index).toBe(target.cell);
          expect(c.response.question.itemCount).toBe(size * size);
          if (kind === 'where')
            expect(en(c.prompt)).toContain(en(objectById(target.objectId).label));
        } else {
          if (c.response.format !== 'single-choice') throw new Error('choice expected');
          const shown = placements.map((p) => en(objectById(p.objectId).label));
          for (const o of c.response.question.options) expect(shown).toContain(en(o.label));
          const { optionId } = c.response.solution;
          const right = c.response.question.options.find((o) => o.id === optionId);
          expect(right && en(right.label)).toBe(en(objectById(target.objectId).label));
        }
      }
    }
  });

  it('probes both place and order on every level', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const { kinds } = DUAL_MEMORY_LEVELS[level];
      const place = (kinds.where ?? 0) + (kinds['where-nth'] ?? 0) + (kinds['which-here'] ?? 0);
      const order = (kinds['which-nth'] ?? 0) + (kinds['where-nth'] ?? 0);
      expect(place).toBeGreaterThan(0);
      expect(order).toBeGreaterThan(0);
    }
  });

  it('raises the load across levels', () => {
    expectNonDecreasing(DUAL_MEMORY_LEVELS, (p) => p.objects, 'objects');
    expectNonDecreasing(DUAL_MEMORY_LEVELS, (p) => p.size, 'size');
    expectNonDecreasing(DUAL_MEMORY_LEVELS, (p) => Object.keys(p.kinds).length, 'question kinds');
    expectNonDecreasing(DUAL_MEMORY_LEVELS, (p) => -p.itemMs, 'pace');
  });
});

describe('Dual Memory Challenge view', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('presents objects one at a time in their cells', () => {
    vi.useFakeTimers();
    const c = generateChallenge(dualMemoryGame, { level: 1, seed: toSeed(6) });
    const [first, second] = c.content.placements as [
      (typeof c.content.placements)[0],
      (typeof c.content.placements)[0],
    ];
    render(
      <DualMemoryView
        challenge={c}
        phase="study"
        locate={null}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    const nameOf = (p: typeof first) =>
      `${en(cellName(p.cell, 3))}, ${en(objectById(p.objectId).label)}`;
    expect(screen.getByRole('listitem', { name: nameOf(first) })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(c.content.itemMs / 2);
    });
    expect(screen.queryByRole('listitem', { name: nameOf(first) })).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(c.content.itemMs / 2);
    });
    expect(screen.getByRole('listitem', { name: nameOf(second) })).toBeInTheDocument();
  });

  it('reports the pressed square for place questions', async () => {
    const user = userEvent.setup();
    let seed = 0;
    let c = generateChallenge(dualMemoryGame, { level: 1, seed: toSeed(seed) });
    while (c.content.kind !== 'where')
      c = generateChallenge(dualMemoryGame, { level: 1, seed: toSeed(++seed) });
    const onLocate = vi.fn();
    render(
      <DualMemoryView
        challenge={c}
        phase="respond"
        locate={{ disabled: false, selectedIndex: null, solutionIndex: null, onLocate }}
        respond={() => undefined}
        answer={null}
        assisted={false}
      />,
    );
    const cell = c.content.placements[c.content.ask]?.cell as number;
    await user.click(screen.getByRole('button', { name: en(cellName(cell, 3)) }));
    expect(onLocate).toHaveBeenCalledWith(cell);
  });
});
