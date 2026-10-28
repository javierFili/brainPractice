import { validateLevelTable } from '@/domain/difficulty';
import { generateChallenge } from '@/domain/game';
import { deriveSeed, toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import { describeGameContract, expectNonDecreasing } from '@/test/gameContract';
import { centroidRate, chanceRate, choiceItems, orderDistance } from '@/test/guessability';
import { dependencyOrderingGame } from './content/definition';
import { DEPENDENCY_LEVELS } from './content/levels';
import type { DependencyChallenge, Need } from './content/types';
import { dependencyOrderingModule } from './index';

describeGameContract(dependencyOrderingModule);

const SEEDS = Array.from({ length: 60 }, (_, i) => deriveSeed(toSeed(31337), i));
const all = DIFFICULTY_LEVELS.flatMap((level) =>
  SEEDS.map((seed) => generateChallenge(dependencyOrderingGame, { level, seed })),
);
const ofKind = (kind: DependencyChallenge['content']['kind']) =>
  all.filter((c) => c.content.kind === kind);

// ── Independent oracle (brute force, no reuse of the game's solver) ────────────────────────────

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}
const respects = (needs: readonly Need[], order: readonly string[]) =>
  needs.every(([p, t]) => order.indexOf(p) < order.indexOf(t));

/** Valid orders by enumerating extensions task by task (exact, fine up to 10 tasks). */
function validOrders(tasks: readonly string[], needs: readonly Need[], cap = 3): string[][] {
  const found: string[][] = [];
  const visit = (order: string[]) => {
    if (found.length >= cap) return;
    if (order.length === tasks.length) return void found.push(order);
    for (const t of tasks)
      if (!order.includes(t) && needs.every(([p, x]) => x !== t || order.includes(p)))
        visit([...order, t]);
  };
  visit([]);
  return found;
}
const hasCycle = (tasks: readonly string[], needs: readonly Need[]) =>
  validOrders(tasks, needs, 1).length === 0;
const parseNeed = (label: string): Need => {
  const [task, pre] = label.split(' needs ') as [string, string];
  return [pre, task];
};

function choice(c: DependencyChallenge) {
  if (c.response.format !== 'single-choice') throw new Error('single-choice expected');
  const { options } = c.response.question;
  const id = c.response.solution.optionId;
  return {
    labels: options.map((o) => o.label),
    answer: options.find((o) => o.id === id)?.label ?? '',
  };
}

describe('Dependency Ordering — oracle', () => {
  it('start-first: the answer is the only option with no needs', () => {
    for (const c of ofKind('start-first')) {
      const { labels, answer } = choice(c);
      const free = labels.filter((t) => !c.content.needs.some(([, x]) => x === t));
      expect(free).toEqual([answer]);
    }
  });

  it('ready-next: the done set is a valid start and exactly one option is unblocked', () => {
    for (const c of ofKind('ready-next')) {
      const { needs, done } = c.content;
      for (const t of done) for (const [p, x] of needs) if (x === t) expect(done).toContain(p);
      const { labels, answer } = choice(c);
      const unblocked = labels.filter(
        (t) => !done.includes(t) && needs.every(([p, x]) => x !== t || done.includes(p)),
      );
      expect(unblocked).toEqual([answer]);
    }
  });

  it('full-order: the solution is the unique valid order', () => {
    const items = ofKind('full-order');
    expect(items.length).toBeGreaterThan(30);
    for (const c of items) {
      if (c.response.format !== 'ordering') throw new Error('ordering expected');
      const { response } = c;
      const labels = response.solution.order.map(
        (id) => response.question.items.find((i) => i.id === id)?.label as string,
      );
      const orders = validOrders(c.content.tasks, c.content.needs);
      expect(orders).toEqual([labels]);
    }
  });

  it('valid-order: exactly one option respects every need', () => {
    for (const c of ofKind('valid-order')) {
      const { labels, answer } = choice(c);
      const ok = labels.filter((l) => respects(c.content.needs, l.split(' → ')));
      expect(ok).toEqual([answer]);
    }
  });

  it('cycle: exactly one new need creates a cycle', () => {
    const items = ofKind('cycle');
    expect(items.length).toBeGreaterThan(30);
    for (const c of items) {
      expect(hasCycle(c.content.tasks, c.content.needs)).toBe(false);
      const { labels, answer } = choice(c);
      const closing = labels.filter((l) =>
        hasCycle(c.content.tasks, [...c.content.needs, parseNeed(l)]),
      );
      expect(closing).toEqual([answer]);
      if (DEPENDENCY_LEVELS[c.level].indirectCycles) {
        const [pre, task] = parseNeed(answer);
        expect(c.content.needs.some(([p, t]) => p === task && t === pre)).toBe(false);
      }
    }
  });

  it('brute force agrees on small graphs', () => {
    for (const c of all.filter((x) => x.content.tasks.length <= 6)) {
      const perms = permutations(c.content.tasks).filter((o) => respects(c.content.needs, o));
      expect(perms.length).toBeGreaterThan(0);
    }
  });
});

describe('Dependency Ordering — levels and measurement', () => {
  it('has a coherent, non-decreasing level table', () => {
    expect(validateLevelTable(DEPENDENCY_LEVELS)).toEqual([]);
    expectNonDecreasing(DEPENDENCY_LEVELS, (p) => p.taskCount, 'tasks');
    expectNonDecreasing(DEPENDENCY_LEVELS, (p) => p.needCount, 'needs');
    expectNonDecreasing(
      DEPENDENCY_LEVELS,
      (p) => Number(p.subtle) + Number(p.indirectCycles),
      'subtlety',
    );
    expectNonDecreasing(DEPENDENCY_LEVELS, (p) => p.timing.targetMs, 'target time');
  });

  it('valid-order: the right order is not the centre of the options', () => {
    const items = choiceItems(ofKind('valid-order'));
    expect(items.length).toBeGreaterThan(60);
    expect(centroidRate(items, orderDistance)).toBeLessThan(chanceRate(items) + 0.15);
  });

  it('cycle: picking the pair that is already connected does not beat chance by much', () => {
    const items = ofKind('cycle');
    let hits = 0;
    for (const c of items) {
      const { labels, answer } = choice(c);
      // Heuristic: the option whose two tasks are linked by a listed need in either direction.
      const linked = labels.filter((l) => {
        const [a, b] = parseNeed(l);
        return c.content.needs.some(([p, t]) => (p === a && t === b) || (p === b && t === a));
      });
      if (linked.includes(answer)) hits += 1 / linked.length;
    }
    expect(hits / items.length).toBeLessThan(0.25 + 0.2);
  });

  it('cycle: “the two tasks are already connected” does not identify the answer', () => {
    const items = ofKind('cycle');
    const reach = (needs: readonly Need[], from: string, to: string): boolean =>
      from === to || needs.some(([p, t]) => p === from && reach(needs, t, to));
    let hits = 0;
    for (const c of items) {
      const { labels, answer } = choice(c);
      const connected = labels.filter((l) => {
        const [a, b] = parseNeed(l);
        return reach(c.content.needs, a, b) || reach(c.content.needs, b, a);
      });
      if (connected.includes(answer)) hits += 1 / connected.length;
    }
    expect(hits / items.length).toBeLessThan(0.25 + 0.12);
  });

  it('generates quickly (< 5 ms per challenge on average)', () => {
    // Best of three rounds: the suite runs many files in parallel, which inflates single rounds.
    const round = () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++)
        generateChallenge(dependencyOrderingGame, { level: 10, seed: toSeed(i) });
      return (performance.now() - start) / 100;
    };
    expect(Math.min(round(), round(), round())).toBeLessThan(5);
  });
});
