import type { Digraph } from '../types';

/** `(incoming, outgoing)` arrow counts of a node, as text. */
export type DegreeSignature = string;

export function signatures(graph: Digraph): Map<string, DegreeSignature> {
  const inDeg = new Map(graph.nodes.map((n) => [n, 0]));
  const outDeg = new Map(graph.nodes.map((n) => [n, 0]));
  for (const [from, to] of graph.edges) {
    outDeg.set(from, (outDeg.get(from) ?? 0) + 1);
    inDeg.set(to, (inDeg.get(to) ?? 0) + 1);
  }
  return new Map(
    graph.nodes.map((n) => [n, `${inDeg.get(n) ?? 0}:${outDeg.get(n) ?? 0}`] as const),
  );
}

/** Multiset of degree signatures: equal for isomorphic graphs (the converse does not hold). */
export const degreeProfile = (graph: Digraph): string =>
  [...signatures(graph).values()].sort().join(' ');

/**
 * A renaming of `a`'s nodes onto `b`'s that maps every arrow onto an arrow, or null. Backtracking
 * that only pairs nodes with the same arrow counts and checks arrows as soon as both ends are
 * placed — fast enough for the ≤ 7-node graphs used here.
 */
export function findIsomorphism(a: Digraph, b: Digraph): Map<string, string> | null {
  if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) return null;
  if (degreeProfile(a) !== degreeProfile(b)) return null;
  const sigA = signatures(a);
  const sigB = signatures(b);
  const arrowsB = new Set(b.edges.map(([from, to]) => `${from}>${to}`));
  const order = [...a.nodes].sort(
    (x, y) =>
      a.edges.filter((e) => e.includes(y)).length - a.edges.filter((e) => e.includes(x)).length,
  );
  const mapping = new Map<string, string>();
  const used = new Set<string>();

  const consistent = (node: string): boolean =>
    a.edges.every(([from, to]) => {
      if (from !== node && to !== node) return true;
      const mf = mapping.get(from);
      const mt = mapping.get(to);
      return mf === undefined || mt === undefined || arrowsB.has(`${mf}>${mt}`);
    });

  const place = (index: number): boolean => {
    const node = order[index];
    if (node === undefined) return true;
    for (const target of b.nodes) {
      if (used.has(target) || sigA.get(node) !== sigB.get(target)) continue;
      mapping.set(node, target);
      used.add(target);
      if (consistent(node) && place(index + 1)) return true;
      mapping.delete(node);
      used.delete(target);
    }
    return false;
  };
  return place(0) ? new Map(mapping) : null;
}

export const isomorphic = (a: Digraph, b: Digraph) => findIsomorphism(a, b) !== null;

export function isAcyclic(graph: Digraph): boolean {
  const remaining = new Set(graph.nodes);
  while (remaining.size > 0) {
    const ready = [...remaining].find(
      (n) => !graph.edges.some(([from, to]) => to === n && remaining.has(from)),
    );
    if (ready === undefined) return false;
    remaining.delete(ready);
  }
  return true;
}

/** Connected when arrows are treated as two-way links. */
export function isConnected(graph: Digraph): boolean {
  const [first] = graph.nodes;
  if (first === undefined) return true;
  const seen = new Set([first]);
  const stack = [first];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const [from, to] of graph.edges) {
      const other = from === current ? to : to === current ? from : null;
      if (other !== null && !seen.has(other)) {
        seen.add(other);
        stack.push(other);
      }
    }
  }
  return seen.size === graph.nodes.length;
}
