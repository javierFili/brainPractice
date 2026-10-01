import { evaluateAnswer } from '@/domain/challenge';
import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import { patternArchitectGame } from '../definition';
import { PATTERN_LEVELS } from '../levels';
import { applyListOp, formatList, LIST_OP_CATALOG } from '../solvers/listOps';
import { applyTreeOp, formatTree, TREE_OPS } from '../solvers/treeOps';
import { degreeProfile } from '../solvers/isomorphism';
import type { PatternChallenge, PatternContent, PatternKind } from '../types';
import {
  acceptedCompletions,
  canonicalForm,
  checkPrograms,
  parseCell,
  sequencePredictions,
} from './bruteForce';

const SEEDS = Array.from({ length: 30 }, (_, i) => i * 7919 + 1);
const generate = (level: DifficultyLevel, seed: number) =>
  generateChallenge(patternArchitectGame, { level, seed });
const all = DIFFICULTY_LEVELS.flatMap((level) => SEEDS.map((seed) => generate(level, seed)));

type Of<K extends PatternKind> = PatternChallenge & {
  content: Extract<PatternContent, { kind: K }>;
};
const ofKind = <K extends PatternKind>(kind: K) =>
  all.filter((c): c is Of<K> => c.content.kind === kind);

function options(challenge: PatternChallenge) {
  const { response } = challenge;
  if (response.format !== 'single-choice') throw new Error(`Unexpected ${response.format}`);
  const correct = response.question.options.find((o) => o.id === response.solution.optionId);
  if (correct === undefined) throw new Error('Solution is not an option');
  return {
    correct: correct.label,
    labels: response.question.options.map((o) => o.label),
    optionId: correct.id,
  };
}

describe('Pattern Architect — generated content', () => {
  it('is deterministic per (level, seed) and varies across seeds', () => {
    for (const level of [1, 4, 7, 10] as const) {
      expect(generate(level, 42)).toEqual(generate(level, 42));
      expect(generate(level, 42).content).not.toEqual(generate(level, 43).content);
    }
  });

  it('only produces kinds allowed by the level, with the level timing', () => {
    for (const c of all) {
      expect(PATTERN_LEVELS[c.level].kinds[c.content.kind]).toBeGreaterThan(0);
      expect(c.timing).toEqual(PATTERN_LEVELS[c.level].timing);
      expect(c.area).toBe('patterns');
    }
  });

  it('accepts its own solution, with distinct options and the planned number of distractors', () => {
    for (const c of all) {
      const { labels, optionId } = options(c);
      expect(evaluateAnswer(c.response, { format: 'single-choice', optionId })).toEqual({
        ok: true,
        value: true,
      });
      expect(new Set(labels).size).toBe(labels.length);
      expect(labels).toHaveLength(PATTERN_LEVELS[c.level].distractors + 1);
    }
  });

  it('writes an explanation that contains the answer', () => {
    for (const c of all) expect(c.explanation).toContain(options(c).correct);
  });

  it('covers every kind across the sample', () => {
    const kinds = new Set(all.map((c) => c.content.kind));
    expect([...kinds].sort()).toEqual(
      [
        'number-sequence',
        'structure-match',
        'symbol-grid',
        'transform-inference',
        'tree-analogy',
      ].sort(),
    );
  });

  it('generates quickly even at level 10', () => {
    const start = performance.now();
    for (let seed = 1000; seed < 1030; seed++) generate(10, seed);
    // Generous budget: the suite runs files in parallel, so wall-clock time is noisy. Real
    // generation takes a few ms; this only catches order-of-magnitude regressions.
    expect((performance.now() - start) / 30).toBeLessThan(50);
  });
});

describe('Pattern Architect — every answer is uniquely determined (independent solvers)', () => {
  it('number-sequence: every bounded rule that fits the terms predicts the answer', () => {
    const challenges = ofKind('number-sequence');
    expect(challenges.length).toBeGreaterThan(20);
    for (const c of challenges) {
      const { correct, labels } = options(c);
      expect([...sequencePredictions(c.content.terms)]).toEqual([Number(correct)]);
      expect(Math.max(...c.content.terms, ...labels.map(Number))).toBeLessThanOrEqual(400);
    }
  });

  it('symbol-grid: exactly one completion follows a rule, and it is the only correct option', () => {
    const challenges = ofKind('symbol-grid');
    expect(challenges.length).toBeGreaterThan(20);
    for (const c of challenges) {
      const { cells } = c.content;
      expect(cells.flat().filter((cell) => cell === null)).toHaveLength(1);
      const shapes = acceptedCompletions(cells, 'shape');
      const counts = acceptedCompletions(cells, 'count');
      expect(shapes.size).toBe(1);
      expect(counts.size).toBe(1);
      const { correct, labels } = options(c);
      const valid = labels.filter((label) => {
        const cell = parseCell(label);
        return shapes.has(cell.shape) && counts.has(cell.count);
      });
      expect(valid).toEqual([correct]);
    }
  });

  it('transform-inference: every program up to the stated depth that fits the examples agrees', () => {
    const challenges = ofKind('transform-inference');
    expect(challenges.length).toBeGreaterThan(40);
    for (const c of challenges) {
      const { examples, question, maxSteps } = c.content;
      expect(maxSteps).toBe(PATTERN_LEVELS[c.level].transform.depth);
      expect(examples.length).toBeGreaterThanOrEqual(2);
      expect(examples.length).toBeLessThanOrEqual(PATTERN_LEVELS[c.level].transform.maxExamples);
      const check = checkPrograms(
        LIST_OP_CATALOG,
        applyListOp,
        formatList,
        examples,
        question,
        maxSteps,
      );
      expect([...check.predictions]).toEqual([options(c).correct]);
      // The examples genuinely need the full composition depth.
      expect(check.shortest).toBe(maxSteps);
    }
  });

  it('tree-analogy: every restructuring up to the stated depth that fits the examples agrees', () => {
    const challenges = ofKind('tree-analogy');
    expect(challenges.length).toBeGreaterThan(20);
    for (const c of challenges) {
      const { examples, question, maxSteps } = c.content;
      const check = checkPrograms(
        TREE_OPS,
        applyTreeOp,
        formatTree,
        examples.map(({ before, after }) => ({ input: before, output: after })),
        question,
        maxSteps,
      );
      expect([...check.predictions]).toEqual([options(c).correct]);
      expect(check.shortest).toBe(maxSteps);
    }
  });

  it('structure-match: exactly one candidate is isomorphic to the reference, and it is the answer', () => {
    const challenges = ofKind('structure-match');
    expect(challenges.length).toBeGreaterThan(20);
    for (const c of challenges) {
      const { reference, candidates } = c.content;
      const target = canonicalForm(reference);
      const forms = candidates.map((candidate) => canonicalForm(candidate.graph));
      const matches = candidates
        .filter((_, i) => forms[i] === target)
        .map((m) => `Graph ${m.name}`);
      expect(matches).toEqual([options(c).correct]);
      // Decoys are different structures from each other too, with the same size.
      expect(new Set(forms).size).toBe(forms.length);
      for (const { graph } of candidates) {
        expect(graph.nodes).toHaveLength(reference.nodes.length);
        expect(graph.edges).toHaveLength(reference.edges.length);
      }
      if (PATTERN_LEVELS[c.level].structure.distractorMutation === 'degree-preserving') {
        for (const { graph } of candidates)
          expect(degreeProfile(graph)).toBe(degreeProfile(reference));
      }
    }
  });
});
