import { numericResponse, singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import {
  ancestors,
  criticalPath,
  criticalPathLength,
  isValidOrder,
  randomTopologicalOrder,
  violatedEdges,
} from '../solvers/graph';
import type { Edge, LogicProfile, TaskGraph } from '../types';
import type { LogicDraft } from './draft';

/** Neutral module names: none implies an order, so only the stated dependencies matter. */
const MODULES = [
  'auth',
  'db',
  'api',
  'ui',
  'cache',
  'queue',
  'logs',
  'mail',
  'search',
  'billing',
  'cdn',
  'metrics',
];

function reachable(edges: readonly Edge[], from: string, to: string): boolean {
  const stack = [from];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const node = stack.pop() as string;
    if (node === to) return true;
    if (seen.has(node)) continue;
    seen.add(node);
    stack.push(...edges.filter(([a]) => a === node).map(([, b]) => b));
  }
  return false;
}

/** Removes edges implied by other paths, so every listed dependency carries information. */
function transitiveReduction(edges: readonly Edge[]): Edge[] {
  return edges.filter(
    (edge, i) =>
      !reachable(
        edges.filter((_, j) => j !== i),
        edge[0],
        edge[1],
      ),
  );
}

/**
 * Random connected DAG: a hidden order, one edge into each node from an earlier node, then extra
 * edges up to the target. Accepted only if the reduced edge count is within 1 of the target.
 */
export function generateGraph(
  random: RandomGenerator,
  nodeCount: number,
  dependencyCount: number,
  weighted: boolean,
): TaskGraph {
  return retryGeneration('task graph', () => {
    const order = sample(random, MODULES, nodeCount);
    const edges: Edge[] = order
      .slice(1)
      .map((node, i) => [order[randomInt(random, 0, i)] as string, node]);
    const candidates = shuffle(
      random,
      order.flatMap((a, i) => order.slice(i + 1).map((b): Edge => [a, b])),
    );
    for (const [a, b] of candidates) {
      if (edges.length >= dependencyCount) break;
      if (!reachable(edges, a, b)) edges.push([a, b]);
    }
    const reduced = transitiveReduction(edges);
    if (Math.abs(reduced.length - dependencyCount) > 1) return null;
    const durations = weighted
      ? Object.fromEntries(order.map((node) => [node, randomInt(random, 1, 4)]))
      : undefined;
    const nodes = [...order].sort();
    return durations
      ? { nodes, edges: shuffle(random, reduced), durations }
      : { nodes, edges: shuffle(random, reduced) };
  });
}

const formatOrder = (order: readonly string[]) => order.join(' → ');
const formatEdge = ([from, to]: Edge) => `${from} → ${to}`;

/**
 * Four options that are all one swap away from the same hidden valid order, exactly one of which
 * still respects every dependency. Because every option is a neighbour of the same base, none of
 * them sits at the "centre" of the others: the player has to check the arrows. `subtle` uses
 * adjacent swaps (each wrong option breaks a single dependency); otherwise any pair may swap.
 */
function orderOptions(
  random: RandomGenerator,
  graph: TaskGraph,
  subtle: boolean,
): { valid: string[]; wrong: string[][] } | null {
  const base = randomTopologicalOrder(graph, random);
  const neighbours: string[][] = [];
  for (let i = 0; i < base.length; i++) {
    for (let j = i + 1; j < base.length; j++) {
      if (subtle && j !== i + 1) continue;
      const swapped = [...base];
      [swapped[i], swapped[j]] = [swapped[j] as string, swapped[i] as string];
      neighbours.push(swapped);
    }
  }
  const valid = neighbours.filter((order) => isValidOrder(graph, order));
  const invalid = neighbours.filter((order) => !isValidOrder(graph, order));
  if (valid.length === 0 || invalid.length < 3) return null;
  const ranked = shuffle(random, invalid).sort((a, b) => {
    const diff = violatedEdges(graph, a).length - violatedEdges(graph, b).length;
    return subtle ? diff : -diff;
  });
  return { valid: pick(random, valid), wrong: ranked.slice(0, 3) };
}

export function dependencyOrder(random: RandomGenerator, profile: LogicProfile): LogicDraft {
  const { nodeCount, dependencyCount, violation } = profile.graph;
  return retryGeneration('dependency order', () => {
    const graph = generateGraph(random, nodeCount, dependencyCount, false);
    const options = orderOptions(random, graph, violation === 'subtle');
    if (options === null) return null;
    const { valid, wrong } = options;
    const broken = wrong.map(
      (order) =>
        `${formatOrder(order)} breaks ${violatedEdges(graph, order).map(formatEdge).join(', ')}`,
    );
    return {
      prompt:
        'Each arrow means the left module must run before the right one. Which execution order is valid?',
      content: { kind: 'dependency-order', graph },
      response: singleChoice(random, formatOrder(valid), wrong.map(formatOrder)),
      explanation: `${formatOrder(valid)} runs every module after all of its dependencies (other valid orders may exist, but none of them was offered). ${broken.join('; ')}.`,
      skills: ['algorithmic-thinking', 'logical-reasoning'],
    };
  });
}

export function dependencyCount(random: RandomGenerator, profile: LogicProfile): LogicDraft {
  const { nodeCount, dependencyCount: edges } = profile.graph;
  return retryGeneration('dependency count', () => {
    const graph = generateGraph(random, nodeCount, edges, false);
    // Prefer targets whose prerequisites are reached through several levels of indirection.
    const deep = graph.nodes.filter((node) => ancestors(graph, node).size >= 3);
    if (deep.length === 0) return null;
    const target = pick(random, deep);
    const required = [...ancestors(graph, target)].sort();
    return {
      prompt: `How many modules must finish (directly or indirectly) before ${target} can start?`,
      content: { kind: 'dependency-count', graph, target },
      response: numericResponse(required.length, 'modules'),
      explanation: `${target} transitively depends on ${required.join(', ')} — ${required.length} modules.`,
      skills: ['decomposition', 'algorithmic-thinking'],
    };
  });
}

export function criticalPathChallenge(random: RandomGenerator, profile: LogicProfile): LogicDraft {
  const { nodeCount, dependencyCount: edges, weighted } = profile.graph;
  return retryGeneration('critical path', () => {
    const graph = generateGraph(random, nodeCount, edges, weighted);
    const length = criticalPathLength(graph);
    // A path through a single chain would make parallelism irrelevant; require real branching.
    if (length === graph.nodes.reduce((sum, node) => sum + (graph.durations?.[node] ?? 1), 0))
      return null;
    const path = criticalPath(graph);
    const unit = weighted
      ? 'rounds (each module takes the rounds shown)'
      : 'rounds (each module takes one round)';
    return {
      prompt: `Independent modules can run in parallel. What is the minimum number of ${unit} to finish everything?`,
      content: { kind: 'critical-path', graph },
      response: numericResponse(length, 'rounds'),
      explanation: `The longest dependency chain is ${formatOrder(path)}, which takes ${length} rounds; everything else fits in parallel alongside it.`,
      skills: ['algorithmic-thinking', 'decomposition'],
    };
  });
}
