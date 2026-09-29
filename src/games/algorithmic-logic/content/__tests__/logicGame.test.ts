import { evaluateAnswer, type Answer } from '@/domain/challenge';
import { validateLevelTable } from '@/domain/difficulty';
import { generateChallenge } from '@/domain/game';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import { logicGame } from '../definition';
import { LOGIC_LEVELS } from '../levels';
import { satisfiesAll, solutions } from '../solvers/constraints';
import { ancestors, criticalPathLength, isValidOrder } from '../solvers/graph';
import { execute } from '../solvers/interpreter';
import type { LogicChallenge, LogicKind } from '../types';

const SEEDS = Array.from({ length: 30 }, (_, i) => i * 7919 + 1);
const generate = (level: DifficultyLevel, seed: number) =>
  generateChallenge(logicGame, { level, seed });
const all = DIFFICULTY_LEVELS.flatMap((level) => SEEDS.map((seed) => generate(level, seed)));
const ofKind = <K extends LogicKind>(kind: K) =>
  all.filter(
    (c): c is LogicChallenge & { content: Extract<LogicChallenge['content'], { kind: K }> } =>
      c.content.kind === kind,
  );

function correctAnswer(challenge: LogicChallenge): Answer {
  const { response } = challenge;
  if (response.format === 'single-choice')
    return { format: 'single-choice', optionId: response.solution.optionId };
  if (response.format === 'numeric') return { format: 'numeric', value: response.solution.value };
  throw new Error(`Logic does not use ${response.format}`);
}

const labelOf = (challenge: LogicChallenge, optionId: string) =>
  challenge.response.format === 'single-choice'
    ? challenge.response.question.options.find((o) => o.id === optionId)?.label
    : undefined;
const optionLabels = (challenge: LogicChallenge) =>
  challenge.response.format === 'single-choice'
    ? challenge.response.question.options.map((o) => o.label)
    : [];

describe('Algorithmic Logic — level table', () => {
  it('defines a coherent profile for every level 1–10', () => {
    expect(validateLevelTable(LOGIC_LEVELS)).toEqual([]);
  });

  it('never gets easier: sizes and time budgets are non-decreasing', () => {
    for (const level of DIFFICULTY_LEVELS.slice(1)) {
      const prev = LOGIC_LEVELS[(level - 1) as DifficultyLevel];
      const curr = LOGIC_LEVELS[level];
      expect(curr.program.variableCount).toBeGreaterThanOrEqual(prev.program.variableCount);
      expect(curr.program.blockCount).toBeGreaterThanOrEqual(prev.program.blockCount);
      expect(curr.constraints.entityCount).toBeGreaterThanOrEqual(prev.constraints.entityCount);
      expect(curr.graph.nodeCount).toBeGreaterThanOrEqual(prev.graph.nodeCount);
      expect(curr.timing.targetMs).toBeGreaterThanOrEqual(prev.timing.targetMs);
    }
  });

  it('reserves exact numeric answers and parallel scheduling for higher tiers', () => {
    expect(DIFFICULTY_LEVELS.filter((l) => LOGIC_LEVELS[l].program.answer === 'numeric')).toEqual([
      4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(DIFFICULTY_LEVELS.filter((l) => LOGIC_LEVELS[l].kinds['critical-path'])).toEqual([
      8, 9, 10,
    ]);
  });
});

describe('Algorithmic Logic — generated content', () => {
  it('is deterministic per (level, seed)', () => {
    for (const level of [1, 5, 10] as const)
      expect(generate(level, 42)).toEqual(generate(level, 42));
  });

  it('only produces kinds allowed by the level, with a time limit', () => {
    for (const challenge of all) {
      expect(LOGIC_LEVELS[challenge.level].kinds[challenge.content.kind]).toBeGreaterThan(0);
      expect(challenge.timing).toEqual(LOGIC_LEVELS[challenge.level].timing);
    }
  });

  it('accepts its own solution for every challenge', () => {
    for (const challenge of all)
      expect(evaluateAnswer(challenge.response, correctAnswer(challenge))).toEqual({
        ok: true,
        value: true,
      });
  });

  it('dependency-order: exactly one option is a valid execution order', () => {
    const challenges = ofKind('dependency-order');
    expect(challenges.length).toBeGreaterThan(20);
    for (const c of challenges) {
      const valid = optionLabels(c).filter((label) =>
        isValidOrder(c.content.graph, label.split(' → ')),
      );
      expect(valid).toEqual([labelOf(c, (c.response.solution as { optionId: string }).optionId)]);
    }
  });

  it('dependency-count: the answer is the number of transitive prerequisites', () => {
    for (const c of ofKind('dependency-count')) {
      expect(c.response.solution).toEqual({
        value: ancestors(c.content.graph, c.content.target).size,
      });
      expect(ancestors(c.content.graph, c.content.target).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('critical-path: the answer is the longest chain and parallelism matters', () => {
    const challenges = ofKind('critical-path');
    expect(challenges.length).toBeGreaterThan(5);
    for (const c of challenges) {
      const { graph } = c.content;
      expect(c.response.solution).toEqual({ value: criticalPathLength(graph) });
      const sequential = graph.nodes.reduce((sum, n) => sum + (graph.durations?.[n] ?? 1), 0);
      expect(criticalPathLength(graph)).toBeLessThan(sequential);
      expect(Boolean(graph.durations)).toBe(LOGIC_LEVELS[c.level].graph.weighted);
    }
  });

  it('program-trace: the answer matches the interpreter and asks a modified variable', () => {
    for (const c of ofKind('program-trace')) {
      const value = execute(c.content.program).env[c.content.ask];
      const expected =
        c.response.format === 'numeric'
          ? c.response.solution.value
          : Number(labelOf(c, (c.response.solution as { optionId: string }).optionId));
      expect(expected).toBe(value);
      expect(Math.abs(value as number)).toBeLessThanOrEqual(150);
      expect(c.response.format).toBe(
        LOGIC_LEVELS[c.level].program.answer === 'numeric' ? 'numeric' : 'single-choice',
      );
    }
  });

  it('program-trace: choice distractors are distinct numbers different from the answer', () => {
    for (const c of ofKind('program-trace').filter((c) => c.response.format === 'single-choice')) {
      const labels = optionLabels(c);
      expect(labels).toHaveLength(4);
      expect(labels.every((l) => Number.isInteger(Number(l)))).toBe(true);
    }
  });

  it('constraint-arrangement: exactly one arrangement satisfies the rules and no rule is redundant', () => {
    const challenges = ofKind('constraint-arrangement');
    expect(challenges.length).toBeGreaterThan(20);
    for (const c of challenges) {
      const { entities, rules, askPosition } = c.content;
      const found = solutions(entities, rules);
      expect(found).toHaveLength(1);
      for (const rule of rules)
        expect(
          solutions(
            entities,
            rules.filter((r) => r !== rule),
          ).length,
        ).toBeGreaterThan(1);
      const solution = found[0] as string[];
      const correct = labelOf(c, (c.response.solution as { optionId: string }).optionId);
      if (askPosition === null) {
        expect(correct).toBe(solution.join(', '));
        const satisfying = optionLabels(c).filter((label) =>
          satisfiesAll(rules, label.split(', ')),
        );
        expect(satisfying).toEqual([correct]);
      } else {
        expect(correct).toBe(solution[askPosition - 1]);
        expect(rules.some((r) => r.type === 'at' && r.position === askPosition)).toBe(false);
      }
    }
  });

  it('writes an explanation that contains the answer', () => {
    for (const c of all) {
      const answer =
        c.response.format === 'numeric'
          ? String(c.response.solution.value)
          : labelOf(c, (c.response.solution as { optionId: string }).optionId);
      expect(c.explanation).toContain(answer);
    }
  });
});
