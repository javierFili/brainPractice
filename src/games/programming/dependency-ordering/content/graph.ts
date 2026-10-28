import { pick, randomInt, shuffle, type RandomGenerator } from '@/domain/random';
import type { Need } from './types';

export const needsOf = (needs: readonly Need[], task: string) =>
  needs.filter(([, t]) => t === task).map(([p]) => p);

/** Does `to` (transitively) need `from`? I.e. is there a path from → … → to. */
export function reaches(needs: readonly Need[], from: string, to: string): boolean {
  const stack = [from];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const node = stack.pop() as string;
    if (node === to) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const [p, t] of needs) if (p === node) stack.push(t);
  }
  return false;
}

/** A shortest chain from → … → to, or null. */
export function path(needs: readonly Need[], from: string, to: string): string[] | null {
  const previous = new Map<string, string>([[from, from]]);
  const queue = [from];
  while (queue.length > 0) {
    const node = queue.shift() as string;
    if (node === to) {
      const chain = [to];
      while (chain[0] !== from) chain.unshift(previous.get(chain[0] as string) as string);
      return chain;
    }
    for (const [p, t] of needs)
      if (p === node && !previous.has(t)) {
        previous.set(t, node);
        queue.push(t);
      }
  }
  return null;
}

/** Removes needs implied by others, so every listed need carries information. */
export const reduce = (needs: readonly Need[]): Need[] =>
  needs.filter(
    (need, i) =>
      !reaches(
        needs.filter((_, j) => j !== i),
        need[0],
        need[1],
      ),
  );

export const ready = (
  tasks: readonly string[],
  needs: readonly Need[],
  done: ReadonlySet<string>,
) => tasks.filter((t) => !done.has(t) && needsOf(needs, t).every((p) => done.has(p)));

/** Number of valid orders, counted up to `cap`. */
export function countOrders(tasks: readonly string[], needs: readonly Need[], cap = 2): number {
  let count = 0;
  const done = new Set<string>();
  const visit = () => {
    if (count >= cap) return;
    if (done.size === tasks.length) {
      count++;
      return;
    }
    for (const task of ready(tasks, needs, done)) {
      done.add(task);
      visit();
      done.delete(task);
    }
  };
  visit();
  return count;
}

export function isValidOrder(needs: readonly Need[], order: readonly string[]): boolean {
  const at = new Map(order.map((t, i) => [t, i]));
  return needs.every(([p, t]) => (at.get(p) ?? -1) < (at.get(t) ?? -1));
}

export const brokenNeeds = (needs: readonly Need[], order: readonly string[]): Need[] => {
  const at = new Map(order.map((t, i) => [t, i]));
  return needs.filter(([p, t]) => (at.get(p) ?? 0) > (at.get(t) ?? 0));
};

/** Kahn's algorithm choosing randomly among ready tasks. */
export function randomOrder(
  random: RandomGenerator,
  tasks: readonly string[],
  needs: readonly Need[],
) {
  const done = new Set<string>();
  const order: string[] = [];
  while (order.length < tasks.length) {
    const next = pick(random, ready(tasks, needs, done));
    done.add(next);
    order.push(next);
  }
  return order;
}

/**
 * Random connected DAG over `tasks`: a hidden order, one need from an earlier task into each task,
 * extra needs up to `needCount`, then reduced. `chain` makes the order unique (a path through
 * every task) and keeps a few redundant shortcuts, as real build files do.
 */
export function randomGraph(
  random: RandomGenerator,
  tasks: readonly string[],
  needCount: number,
  chain = false,
): Need[] | null {
  const order = shuffle(random, tasks);
  if (chain) {
    const needs: Need[] = order.slice(1).map((t, i) => [order[i] as string, t]);
    const shortcuts = randomInt(random, 1, 2);
    for (let s = 0; s < shortcuts; s++) {
      const i = randomInt(random, 0, order.length - 3);
      const j = randomInt(random, i + 2, order.length - 1);
      if (!needs.some(([p, t]) => p === order[i] && t === order[j]))
        needs.push([order[i] as string, order[j] as string]);
    }
    return shuffle(random, needs);
  }
  const needs: Need[] = order.slice(1).map((t, i) => [order[randomInt(random, 0, i)] as string, t]);
  const candidates = shuffle(
    random,
    order.flatMap((a, i) => order.slice(i + 1).map((b): Need => [a, b])),
  );
  for (const [a, b] of candidates) {
    if (needs.length >= needCount) break;
    if (!reaches(needs, a, b)) needs.push([a, b]);
  }
  const reduced = reduce(needs);
  if (Math.abs(reduced.length - needCount) > 1) return null;
  return shuffle(random, reduced);
}
