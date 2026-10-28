import type { RandomGenerator } from '@/domain/random';
import { pick } from '@/domain/random';
import type { Edge, TaskGraph } from '../types';

export function predecessors(graph: TaskGraph, node: string): string[] {
  return graph.edges.filter(([, to]) => to === node).map(([from]) => from);
}

/** All tasks that must finish before `node` can start (transitive). */
export function ancestors(graph: TaskGraph, node: string): Set<string> {
  const found = new Set<string>();
  const stack = predecessors(graph, node);
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (found.has(current)) continue;
    found.add(current);
    stack.push(...predecessors(graph, current));
  }
  return found;
}

/** True when `order` lists every node exactly once and respects every edge. */
export function isValidOrder(graph: TaskGraph, order: readonly string[]): boolean {
  if (order.length !== graph.nodes.length || new Set(order).size !== order.length) return false;
  const position = new Map(order.map((node, i) => [node, i]));
  if (graph.nodes.some((node) => !position.has(node))) return false;
  return graph.edges.every(
    ([from, to]) => (position.get(from) as number) < (position.get(to) as number),
  );
}

/** Edges whose order is broken by `order` (assumes `order` is a permutation of the nodes). */
export function violatedEdges(graph: TaskGraph, order: readonly string[]): Edge[] {
  const position = new Map(order.map((node, i) => [node, i]));
  return graph.edges.filter(([from, to]) => (position.get(from) ?? 0) > (position.get(to) ?? 0));
}

/** Kahn's algorithm choosing randomly among ready tasks: any valid execution order. */
export function randomTopologicalOrder(graph: TaskGraph, random: RandomGenerator): string[] {
  const remaining = new Set(graph.nodes);
  const order: string[] = [];
  while (remaining.size > 0) {
    const ready = [...remaining].filter((node) =>
      predecessors(graph, node).every((p) => !remaining.has(p)),
    );
    if (ready.length === 0) throw new Error('Graph has a cycle');
    const next = pick(random, ready);
    order.push(next);
    remaining.delete(next);
  }
  return order;
}

/**
 * Minimum rounds to finish every task with unlimited parallel workers: the longest (weighted)
 * dependency chain.
 */
export function criticalPathLength(graph: TaskGraph): number {
  const finish = new Map<string, number>();
  const finishOf = (node: string): number => {
    const cached = finish.get(node);
    if (cached !== undefined) return cached;
    const start = Math.max(0, ...predecessors(graph, node).map(finishOf));
    const value = start + (graph.durations?.[node] ?? 1);
    finish.set(node, value);
    return value;
  };
  return Math.max(...graph.nodes.map(finishOf));
}

/** One longest chain, for explanations. */
export function criticalPath(graph: TaskGraph): string[] {
  const duration = (node: string) => graph.durations?.[node] ?? 1;
  const best = new Map<string, { length: number; path: string[] }>();
  const bestOf = (node: string): { length: number; path: string[] } => {
    const cached = best.get(node);
    if (cached) return cached;
    const options = predecessors(graph, node).map(bestOf);
    const longest = options.reduce<{ length: number; path: string[] }>(
      (acc, option) => (option.length > acc.length ? option : acc),
      { length: 0, path: [] },
    );
    const value = { length: longest.length + duration(node), path: [...longest.path, node] };
    best.set(node, value);
    return value;
  };
  return graph.nodes.map(bestOf).reduce((a, b) => (b.length > a.length ? b : a)).path;
}
