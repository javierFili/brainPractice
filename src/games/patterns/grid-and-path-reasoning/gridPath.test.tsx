import { render, screen } from '@testing-library/react';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { expectFastGeneration, generateMany, solutionLabel } from '../shared/testing';
import { gridPathGame } from './content/definition';
import { GRID_PATH_LEVELS } from './content/levels';
import type { GridPathContent } from './content/types';
import { gridPathModule } from './index';
import { GridPathView } from './ui/GridPathView';

describeGameContract(gridPathModule);

// ── Independent oracle: distances by repeated relaxation (no queue), cut cells by removal ─────────

function relaxDistances(size: number, walls: ReadonlySet<number>, from: number): number[] {
  const dist = Array.from({ length: size * size }, (_, i) => (i === from ? 0 : Infinity));
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < size * size; i++) {
      if (walls.has(i)) continue;
      const r = Math.floor(i / size);
      const c = i % size;
      const near = [
        r > 0 ? i - size : -1,
        r < size - 1 ? i + size : -1,
        c > 0 ? i - 1 : -1,
        c < size - 1 ? i + 1 : -1,
      ].filter((n) => n >= 0 && !walls.has(n));
      const best = Math.min(dist[i] ?? Infinity, ...near.map((n) => (dist[n] ?? Infinity) + 1));
      if (best < (dist[i] ?? Infinity)) {
        dist[i] = best;
        changed = true;
      }
    }
  }
  return dist;
}

const wallsOf = (content: GridPathContent) => new Set(content.walls);
const dist = (content: GridPathContent, from: number, to: number, extra: number[] = []) =>
  relaxDistances(content.size, new Set([...content.walls, ...extra]), from)[to] ?? Infinity;

describe('Grid and Path Reasoning', () => {
  const all = generateMany(gridPathGame, 30);

  it('has one correct answer per maze, confirmed by an independent solver', () => {
    for (const { challenge } of all) {
      const { content, response } = challenge;
      const goal = content.goal;
      expect(wallsOf(content).has(content.start)).toBe(false);
      switch (content.kind) {
        case 'shortest-length': {
          if (response.format !== 'numeric' || goal === null) throw new Error('numeric expected');
          expect(dist(content, content.start, goal)).toBe(response.solution.value);
          break;
        }
        case 'reachable-exit': {
          const reach = content.exits.map((e) => dist(content, content.start, e) < Infinity);
          expect(reach.filter(Boolean)).toHaveLength(1);
          const letter = String.fromCharCode(65 + reach.indexOf(true));
          expect(solutionLabel(challenge)).toBe(`Exit ${letter}`);
          break;
        }
        case 'must-pass': {
          if (goal === null) throw new Error('goal expected');
          const d = dist(content, content.start, goal);
          const blockedLonger = content.marks.map(
            (m) => dist(content, content.start, goal, [m]) > d,
          );
          const offRoute = content.marks.map(
            (m) => dist(content, content.start, m) + dist(content, m, goal) > d,
          );
          const answer = Number(solutionLabel(challenge).replace('Cell ', '')) - 1;
          content.marks.forEach((_, i) => {
            if (i === answer) expect(blockedLonger[i]).toBe(true);
            else expect(offRoute[i]).toBe(true);
          });
          break;
        }
      }
    }
  });

  it('forces the stated detour around the walls', () => {
    for (const { level, challenge } of all) {
      const { content } = challenge;
      if (content.goal === null) continue;
      const { size, start, goal } = content;
      const straight =
        Math.abs(Math.floor(start / size) - Math.floor(goal / size)) +
        Math.abs((start % size) - (goal % size));
      expect(dist(content, start, goal)).toBeGreaterThanOrEqual(
        straight + GRID_PATH_LEVELS[level].detour,
      );
    }
  });

  it('raises the load across levels', () => {
    for (const key of ['size', 'density', 'minDistance', 'detour', 'exits', 'marks'] as const)
      expectNonDecreasing(GRID_PATH_LEVELS, (p) => p[key], key);
  });

  it('describes the maze row by row for screen readers', () => {
    const entry = all.find(({ challenge }) => challenge.content.kind === 'reachable-exit');
    if (!entry) throw new Error('no exit maze');
    render(
      <GridPathView
        challenge={entry.challenge}
        phase="respond"
        locate={null}
        respond={null}
        answer={null}
        assisted={false}
      />,
    );
    expect(screen.getByText(/turtle \(start\) at column/)).toBeInTheDocument();
    expect(screen.getAllByText(/exit A at column/)).toHaveLength(1);
  });

  it('generates quickly', () => {
    expectFastGeneration(gridPathGame);
  });
});
