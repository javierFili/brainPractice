import { singleChoice } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, randomInt, sample, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { gridKey, type Draft } from '../../shared/content';
import { RULE_DISCOVERY_LEVELS } from './levels';
import {
  applyChain,
  cellsKey,
  chains,
  flatten,
  ruleLibrary,
  runChain,
  sameCells,
  unflatten,
  type Cells,
  type GridRule,
} from './rules';
import type { RuleDiscoveryChallenge, RuleDiscoveryContent, RuleDiscoveryProfile } from './types';

export const RULE_DISCOVERY_ID = gameIdOf('rule-based-pattern-discovery');

function randomInput(random: RandomGenerator, size: number, kinds: readonly number[]) {
  const density = 0.3 + random.next() * 0.2;
  return Array.from({ length: size * size }, () =>
    random.next() < density ? pick(random, kinds) : 0,
  );
}

interface FlatExample {
  readonly input: Cells;
  readonly output: Cells;
}

/** Chains that map the example's input to its output; each first step runs once per example. */
function fitting(list: readonly GridRule[][], example: FlatExample, n: number): GridRule[][] {
  const firstOut = new Map<GridRule, Cells>();
  return list.filter((chain) => {
    const [head, ...tail] = chain as [GridRule, ...GridRule[]];
    let cells = firstOut.get(head);
    if (cells === undefined) {
      cells = head.run(example.input, n);
      firstOut.set(head, cells);
    }
    for (const rule of tail) cells = rule.run(cells, n);
    return sameCells(cells, example.output);
  });
}

const explains = (chain: readonly GridRule[], examples: readonly FlatExample[], n: number) =>
  examples.every((e) => sameCells(runChain(chain, e.input, n), e.output));

/**
 * Independent check: every chain of the level's length (or shorter) from the full rule library
 * that turns each example input into its output; the challenge is valid only when all of them
 * give the same output for the new input.
 */
export function consistentOutputs(content: RuleDiscoveryContent): string[] {
  const n = content.question.length;
  const kinds = [...new Set(content.examples.flatMap((e) => e.input.flat()))].filter((v) => v > 0);
  const examples = content.examples.map((e) => ({
    input: flatten(e.input),
    output: flatten(e.output),
  }));
  const outputs = new Set<string>();
  for (const chain of chains(ruleLibrary(kinds), content.steps)) {
    if (explains(chain, examples, n)) outputs.add(gridKey(applyChain(chain, content.question)));
  }
  return [...outputs];
}

function draft(random: RandomGenerator, profile: RuleDiscoveryProfile) {
  const { size: n } = profile;
  const steps = profile.secondFamilies.length > 0 ? 2 : 1;
  return retryGeneration('rule discovery', (): Draft<RuleDiscoveryChallenge> | null => {
    const kinds = sample(random, [1, 2, 3, 4], profile.tileKinds);
    const library = ruleLibrary(kinds);
    const first = pick(
      random,
      library.filter((r) => profile.families.includes(r.family)),
    );
    const second =
      steps === 2
        ? pick(
            random,
            library.filter(
              (r) => profile.secondFamilies.includes(r.family) && r.family !== first.family,
            ),
          )
        : null;
    const rule = second === null ? [first] : [first, second];
    const fresh = (): FlatExample | null => {
      for (let i = 0; i < 20; i++) {
        const input = randomInput(random, n, kinds);
        if (!kinds.every((k) => input.includes(k))) continue;
        // Every step must visibly change the grid, so each one can be seen in the examples.
        const middle = first.run(input, n);
        if (sameCells(middle, input)) continue;
        const output = second === null ? middle : second.run(middle, n);
        if (second !== null && sameCells(output, middle)) continue;
        return { input, output };
      }
      return null;
    };
    const question = fresh();
    if (question === null) return null;
    const candidates = chains(library, steps);
    const examples: FlatExample[] = [];
    let alive = candidates;
    let predicted = new Set<string>();
    while (examples.length < profile.maxExamples) {
      const example = fresh();
      if (example === null) return null;
      if (examples.some((e) => sameCells(e.input, example.input))) continue;
      examples.push(example);
      alive = fitting(alive, example, n);
      if (examples.length < profile.minExamples) continue;
      predicted = new Set(alive.map((chain) => cellsKey(runChain(chain, question.input, n))));
      if (predicted.size === 1) break;
    }
    if (predicted.size !== 1 || !predicted.has(cellsKey(question.output))) return null;

    // Wrong outputs come from other rules applied to the new input; rules that fit some of the
    // examples come first, since they are the tempting ones.
    const singles = candidates.slice(0, library.length);
    const pairs = candidates.slice(library.length);
    const pool = [...singles, ...sample(random, pairs, Math.min(60, pairs.length))];
    const banned = new Set([cellsKey(question.output), cellsKey(question.input)]);
    const scored = pool
      .map((chain) => {
        const cells = runChain(chain, question.input, n);
        const score = examples.filter((e) =>
          sameCells(runChain(chain, e.input, n), e.output),
        ).length;
        return { cells, key: cellsKey(cells), score };
      })
      .filter((c) => !banned.has(c.key));
    scored.sort((a, b) => b.score - a.score);
    const wrong: Cells[] = [];
    const taken = new Set<string>();
    const add = (c: (typeof scored)[number]) => {
      if (taken.has(c.key)) return;
      taken.add(c.key);
      wrong.push(c.cells);
    };
    const tempting = Math.min(randomInt(random, 0, 2), profile.options - 1);
    for (const c of scored) if (wrong.length < tempting && c.score > 0) add(c);
    for (const c of shuffle(random, scored)) if (wrong.length < profile.options - 1) add(c);
    if (wrong.length < profile.options - 1) return null;

    const label = (cells: Cells) => gridKey(unflatten(cells, n));
    const content: RuleDiscoveryContent = {
      kind: second === null ? first.family : 'two-step',
      examples: examples.map((e) => ({
        input: unflatten(e.input, n),
        output: unflatten(e.output, n),
      })),
      question: unflatten(question.input, n),
      steps,
    };
    return {
      prompt:
        steps === 1
          ? 'The same change turns every input into its output. What does the new input become?'
          : 'Two changes, one after the other, turn every input into its output. What does the new input become?',
      content,
      response: singleChoice(random, label(question.output), wrong.map(label)),
      explanation: `In every example the grid ${rule.map((r) => r.words).join(', and then ')}. Doing the same to the new input gives the chosen grid.`,
      skills:
        steps === 1
          ? ['pattern-recognition', 'abstraction', 'logical-reasoning']
          : ['pattern-recognition', 'abstraction', 'decomposition', 'logical-reasoning'],
    };
  });
}

export const ruleDiscoveryGame: GameDefinition<RuleDiscoveryChallenge, RuleDiscoveryProfile> = {
  id: RULE_DISCOVERY_ID,
  name: 'Rule-Based Pattern Discovery',
  tagline: 'Work out the rule from examples.',
  description:
    'Each example shows a small grid before and after a hidden change: a mirror, a turn, a slide, tiles changing kind or falling down. Work out the change and choose what a new grid becomes. Higher levels chain two changes.',
  area: 'patterns',
  skills: ['pattern-recognition', 'abstraction', 'logical-reasoning', 'decomposition'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Each puzzle counts as correct when you choose the grid the hidden rule produces. Your result is the share of puzzles solved; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'Compare each input grid with its output: what moved, turned, changed kind or fell?',
    'Check that your idea works for every example, not just the first.',
    'Apply the same change to the new input and choose the result. From level 8 the rule is two changes in a row.',
    'Tiles differ by shape as well as colour, and every grid is also described in words.',
  ],
  simpleInstructions: 'See how each picture changes, then change the new one the same way.',
  levels: RULE_DISCOVERY_LEVELS,
  generate({ identity, profile, random }) {
    return { ...identity, ...draft(random, profile), timing: profile.timing };
  },
};
