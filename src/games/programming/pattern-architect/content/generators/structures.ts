import type { ResponseOf } from '@/domain/challenge';
import { singleChoice } from '@/domain/challenge';
import { retryGeneration } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import {
  degreeProfile,
  findIsomorphism,
  isAcyclic,
  isConnected,
  isomorphic,
  signatures,
  type DegreeSignature,
} from '../solvers/isomorphism';
import { joinText, msg, textId, type Message, type Text } from '@/domain/shared';
import type { Arrow, Digraph, PatternProfile } from '../types';
import type { PatternDraft } from './draft';

const REFERENCE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const CANDIDATE_LABELS = ['1', '2', '3', '4', '5', '6', '7'];
const NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const arrowKey = ([from, to]: Arrow) => `${from}>${to}`;
const sortArrows = (edges: readonly Arrow[]) =>
  [...edges].sort((x, y) => x[0].localeCompare(y[0]) || x[1].localeCompare(y[1]));

/** Connected acyclic graph: every arrow points forward in a hidden order (like dependencies). */
function randomDag(random: RandomGenerator, nodeCount: number, arrowCount: number): Digraph {
  const order = sample(random, REFERENCE_LABELS.slice(0, nodeCount), nodeCount);
  const edges: Arrow[] = order
    .slice(1)
    .map((node, i) => [order[randomInt(random, 0, i)] as string, node]);
  const extra = shuffle(
    random,
    order.flatMap((a, i) => order.slice(i + 1).map((b): Arrow => [a, b])),
  ).filter((arrow) => !edges.some((e) => arrowKey(e) === arrowKey(arrow)));
  edges.push(...extra.slice(0, Math.max(0, arrowCount - edges.length)));
  return { nodes: [...order].sort(), edges: sortArrows(edges) };
}

const isValid = (graph: Digraph) =>
  new Set(graph.edges.map(arrowKey)).size === graph.edges.length &&
  graph.edges.every(([from, to]) => from !== to) &&
  isAcyclic(graph) &&
  isConnected(graph);

/** Moves one end of one arrow: usually changes how many arrows some node has. */
function rewire(random: RandomGenerator, graph: Digraph): Digraph {
  const index = randomInt(random, 0, graph.edges.length - 1);
  const [from, to] = graph.edges[index] as Arrow;
  const other = pick(random, graph.nodes);
  const moved: Arrow = randomInt(random, 0, 1) === 0 ? [other, to] : [from, other];
  return { nodes: graph.nodes, edges: graph.edges.map((e, i) => (i === index ? moved : e)) };
}

/** Swaps the targets of two arrows: every node keeps its incoming and outgoing counts. */
function crossSwap(random: RandomGenerator, graph: Digraph): Digraph {
  const [i, j] = sample(
    random,
    graph.edges.map((_, k) => k),
    2,
  ) as [number, number];
  const [a, b] = graph.edges[i] as Arrow;
  const [c, d] = graph.edges[j] as Arrow;
  return {
    nodes: graph.nodes,
    edges: graph.edges.map((e, k): Arrow => (k === i ? [a, d] : k === j ? [c, b] : e)),
  };
}

function relabel(random: RandomGenerator, graph: Digraph): Digraph {
  const targets = shuffle(random, CANDIDATE_LABELS.slice(0, graph.nodes.length));
  const rename = new Map(graph.nodes.map((node, i) => [node, targets[i] as string]));
  const map = (node: string) => rename.get(node) as string;
  return {
    nodes: [...targets].sort(),
    edges: sortArrows(graph.edges.map(([from, to]): Arrow => [map(from), map(to)])),
  };
}

const KEY = 'programming:patternArchitect.structure';

/** `2 in / 1 out` for a node's arrow counts (`in:out`). */
const describeSignature = (sig: string): Message => {
  const [incoming = '0', outgoing = '0'] = sig.split(':');
  return msg(`${KEY}.signature`, { in: incoming, out: outgoing });
};

/**
 * Each node's arrow counts together with the arrow counts of the nodes it points to, as
 * `in:out|in:out,in:out` (described in words only when shown).
 */
function neighbourhoods(graph: Digraph): string[] {
  const sig = signatures(graph);
  return graph.nodes.map((node) => {
    const targets = graph.edges
      .filter(([from]) => from === node)
      .map(([, to]) => sig.get(to) as DegreeSignature)
      .sort();
    return `${sig.get(node) as DegreeSignature}|${targets.join(',')}`;
  });
}

const tally = (values: readonly string[]) => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
};

/** Why a candidate is not a match, in terms the player can check (without naming the graph). */
function whyDifferent(reference: Digraph, candidate: Digraph): Message {
  const ref = tally([...signatures(reference).values()]);
  const found = [...tally([...signatures(candidate).values()])].find(
    ([sig, n]) => n > (ref.get(sig) ?? 0),
  );
  if (found !== undefined) {
    const [sig, n] = found;
    return msg(`${KEY}.reason.counts`, {
      count: n,
      signature: describeSignature(sig),
      expected: ref.get(sig) ?? 0,
    });
  }
  const candidateNeighbourhoods = tally(neighbourhoods(candidate));
  const missing = neighbourhoods(reference).find(
    (n) => !candidateNeighbourhoods.has(n) && !n.endsWith('|'),
  );
  if (missing !== undefined) {
    const [own = '', targets = ''] = missing.split('|');
    return msg(`${KEY}.reason.neighbourhood`, {
      own: describeSignature(own),
      targets: joinText(targets.split(',').map(describeSignature), ', '),
    });
  }
  return msg(`${KEY}.reason.noRenaming`);
}

/** "Graph A: reason. Graphs B and D: reason." — identical reasons are stated once. */
function groupReasons(entries: readonly { name: string; reason: Message }[]): Text {
  const groups = new Map<string, { reason: Message; names: string[] }>();
  for (const { name, reason } of entries) {
    const group = groups.get(textId(reason)) ?? { reason, names: [] };
    group.names.push(name);
    groups.set(textId(reason), group);
  }
  return joinText(
    [...groups.values()].map(({ reason, names }) =>
      names.length === 1
        ? msg(`${KEY}.reasonOne`, { name: names[0] as string, reason })
        : msg(`${KEY}.reasonMany`, { names: joinText(names), reason }),
    ),
    ' ',
  );
}

/**
 * Keeps the displayed candidate order A, B, C… for the answer buttons too. Options are drawn by
 * graph name (sorting by name is the same as sorting by "Graph X"), then labelled in words.
 */
function orderedChoice(random: RandomGenerator, correct: string, wrong: readonly string[]) {
  const response = singleChoice(random, correct, wrong);
  // The builder was given plain names, so every label here is a literal string.
  const named = response.question.options.map((option) => ({
    id: option.id,
    name: typeof option.label === 'string' ? option.label : '',
  }));
  const options = named
    .sort((x, y) => x.name.localeCompare(y.name))
    .map(({ id, name }) => ({ id, label: msg(`${KEY}.graph`, { name }) }));
  return { ...response, question: { options } } satisfies ResponseOf<'single-choice'>;
}

export function structureMatch(random: RandomGenerator, profile: PatternProfile): PatternDraft {
  const { elementCount, arrowCount, distractorMutation } = profile.structure;
  const mutate = distractorMutation === 'rewire' ? rewire : crossSwap;
  return retryGeneration('structure match', () => {
    const reference = randomDag(random, elementCount, arrowCount);
    const decoys: Digraph[] = [];
    for (let attempt = 0; attempt < 40 && decoys.length < profile.distractors; attempt++) {
      const decoy = mutate(random, reference);
      if (!isValid(decoy) || isomorphic(decoy, reference)) continue;
      if (
        distractorMutation === 'degree-preserving' &&
        degreeProfile(decoy) !== degreeProfile(reference)
      )
        continue;
      if (decoys.some((d) => isomorphic(d, decoy))) continue;
      decoys.push(decoy);
    }
    if (decoys.length < profile.distractors) return null;
    const match = relabel(random, reference);
    const graphs = shuffle(random, [match, ...decoys.map((d) => relabel(random, d))]);
    const candidates = graphs.map((graph, i) => ({ name: NAMES[i] as string, graph }));
    const correct = candidates.find((c) => c.graph === match) as { name: string; graph: Digraph };
    const mapping = findIsomorphism(reference, match) as Map<string, string>;
    const renaming = [...mapping]
      .sort(([x], [y]) => x.localeCompare(y))
      .map(([from, to]) => `${from} = ${to}`)
      .join(', ');
    const reasons = groupReasons(
      candidates
        .filter((c) => c !== correct)
        .map((c) => ({ name: c.name, reason: whyDifferent(reference, c.graph) })),
    );
    return {
      prompt: msg(`${KEY}.prompt`),
      content: { kind: 'structure-match', reference, candidates },
      response: orderedChoice(
        random,
        correct.name,
        candidates.filter((c) => c !== correct).map((c) => c.name),
      ),
      explanation: msg(`${KEY}.explanation`, { name: correct.name, renaming, reasons }),
      skills: ['abstraction', 'pattern-recognition'],
    };
  });
}
