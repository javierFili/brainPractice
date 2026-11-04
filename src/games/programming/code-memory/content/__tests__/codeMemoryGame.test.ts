import { evaluateAnswer, solutionAnswer, type Answer } from '@/domain/challenge';
import { validateLevelTable } from '@/domain/difficulty';
import { generateChallenge } from '@/domain/game';
import { deriveSeed, toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import { codeMemoryGame } from '../definition';
import { CODE_MEMORY_LEVELS } from '../levels';
import { loadUnits, STUDY_WEIGHT, timingFor } from '../load';
import type { Assignment, DataRecord, MemoryChallenge, MemoryKind, Operand } from '../types';
import { KEYWORD_FAMILIES } from '../vocabulary';
import { en } from '@/test/i18n';

// Derived like session seeds, so kinds are spread as they are in real play.
const SEEDS = Array.from({ length: 40 }, (_, i) => deriveSeed(toSeed(20260929), i));
const generate = (level: DifficultyLevel, seed: number) =>
  generateChallenge(codeMemoryGame, { level, seed });
const all = DIFFICULTY_LEVELS.flatMap((level) => SEEDS.map((seed) => generate(level, seed)));
const ofKind = <K extends MemoryKind>(kind: K) =>
  all.filter(
    (c): c is MemoryChallenge & { content: Extract<MemoryChallenge['content'], { kind: K }> } =>
      c.content.kind === kind,
  );

const correctAnswer = (challenge: MemoryChallenge): Answer => solutionAnswer(challenge.response);

const options = (c: MemoryChallenge) =>
  c.response.format === 'single-choice' ? c.response.question.options.map((o) => o.label) : [];
function solutionLabel({ response }: MemoryChallenge) {
  if (response.format !== 'single-choice') return undefined;
  return response.question.options.find((o) => o.id === response.solution.optionId)?.label;
}
const valueOf = (record: DataRecord | undefined, field: string) =>
  record?.fields.find((f) => f.name === field)?.value;

/** The solution is the only option that matches the independently derived truth. */
function expectOnlyCorrectOption(c: MemoryChallenge, truth: string | undefined) {
  expect(truth).toBeDefined();
  expect(options(c).filter((label) => label === truth)).toHaveLength(1);
  expect(solutionLabel(c)).toBe(truth);
}

/** Independent interpreter for the assignment lines (does not reuse the game's solver). */
function run(lines: readonly Assignment[], upTo: number): Map<string, number> {
  const env = new Map<string, number>();
  const read = (o: Operand) => (o.type === 'num' ? o.value : (env.get(o.name) ?? Number.NaN));
  for (const { target, expr } of lines.slice(0, upTo)) {
    if (expr.type !== 'bin') env.set(target, read(expr));
    else {
      const [a, b] = [read(expr.left), read(expr.right)];
      env.set(target, expr.op === '+' ? a + b : expr.op === '-' ? a - b : a * b);
    }
  }
  return env;
}

describe('Code Memory — level table', () => {
  it('defines a coherent profile for every level 1–10', () => {
    expect(validateLevelTable(CODE_MEMORY_LEVELS)).toEqual([]);
  });

  it('never gets easier: load grows while study time per item shrinks', () => {
    for (const level of DIFFICULTY_LEVELS.slice(1)) {
      const prev = CODE_MEMORY_LEVELS[(level - 1) as DifficultyLevel];
      const curr = CODE_MEMORY_LEVELS[level];
      const load = (p: typeof curr) => [
        p.records.recordCount,
        p.records.fieldCount,
        p.records.recordCount * p.records.fieldCount,
        p.sequence.sequenceLength,
        p.state.variableCount,
        p.state.lineCount,
        p.state.ops.length,
        p.grid.rows * p.grid.cols,
        p.grid.elementCount,
        p.distractors,
      ];
      load(curr).forEach((value, i) => {
        expect(value).toBeGreaterThanOrEqual(load(prev)[i] as number);
      });
      expect(curr.study.perItemMs).toBeLessThanOrEqual(prev.study.perItemMs);
      expect(curr.study.minMs).toBeLessThanOrEqual(prev.study.minMs);
      expect(curr.timing.targetMs).toBeGreaterThanOrEqual(prev.timing.targetMs);
    }
  });

  it('introduces stricter formats and new reasoning only at higher tiers', () => {
    const levelsWhere = (predicate: (level: DifficultyLevel) => boolean) =>
      DIFFICULTY_LEVELS.filter(predicate);
    const L = CODE_MEMORY_LEVELS;
    expect(levelsWhere((l) => L[l].state.answer === 'numeric')).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(levelsWhere((l) => L[l].sequence.questions.includes('order'))).toEqual([
      5, 6, 7, 8, 9, 10,
    ]);
    expect(levelsWhere((l) => (L[l].kinds['cross-reference'] ?? 0) > 0)).toEqual([7, 8, 9, 10]);
    expect(levelsWhere((l) => (L[l].kinds['foreign-key-join'] ?? 0) > 0)).toEqual([9, 10]);
    expect(levelsWhere((l) => L[l].join !== null)).toEqual([9, 10]);
    expect(levelsWhere((l) => L[l].state.question === 'mixed')).toEqual([7, 8, 9, 10]);
  });
});

describe('Code Memory — generated content', () => {
  it('is deterministic per (level, seed)', () => {
    for (const level of DIFFICULTY_LEVELS) expect(generate(level, 42)).toEqual(generate(level, 42));
  });

  it('is fast enough to generate on demand', () => {
    // Measuring wall time is the point of this test; content code itself never reads a clock.
    const start = performance.now();
    for (let seed = 0; seed < 100; seed++) generate(10, seed);
    // Generous budget: the suite runs files in parallel, so wall-clock time is noisy. Real
    // generation takes a few ms; this only catches order-of-magnitude regressions.
    expect((performance.now() - start) / 100).toBeLessThan(50);
  });

  it('only produces kinds allowed by the level, and every allowed kind appears', () => {
    for (const level of DIFFICULTY_LEVELS) {
      const kinds = new Set(all.filter((c) => c.level === level).map((c) => c.content.kind));
      const allowed = Object.keys(CODE_MEMORY_LEVELS[level].kinds);
      expect([...kinds].sort()).toEqual([...allowed].sort());
    }
  });

  it('always has a study phase sized to the load, within the level bounds', () => {
    for (const c of all) {
      const profile = CODE_MEMORY_LEVELS[c.level];
      expect(c.timing).toEqual(timingFor(c.content, profile));
      expect(c.timing.studyMs).not.toBeNull();
      expect(c.timing.studyMs).toBeGreaterThanOrEqual(profile.study.minMs);
      expect(c.timing.studyMs).toBeLessThanOrEqual(profile.timing.studyMs ?? 0);
      expect(c.timing.limitMs).toBe(profile.timing.limitMs);
    }
  });

  it('gives less study time per item as levels rise', () => {
    const meanPerItem = (level: DifficultyLevel) => {
      const ratios = all
        .filter((c) => c.level === level)
        .map(
          (c) => (c.timing.studyMs ?? 0) / (loadUnits(c.content) * STUDY_WEIGHT[c.content.kind]),
        );
      return ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
    };
    for (const level of DIFFICULTY_LEVELS.slice(1))
      expect(meanPerItem(level)).toBeLessThanOrEqual(meanPerItem((level - 1) as DifficultyLevel));
  });

  it('accepts its own solution for every challenge', () => {
    for (const c of all)
      expect(evaluateAnswer(c.response, correctAnswer(c))).toEqual({ ok: true, value: true });
  });

  it('offers exactly the configured number of distinct options on choice questions', () => {
    for (const c of all.filter((c) => c.response.format === 'single-choice')) {
      const labels = options(c);
      expect(new Set(labels).size).toBe(labels.length);
      expect(labels).toHaveLength(CODE_MEMORY_LEVELS[c.level].distractors + 1);
    }
  });

  it('record-recall: names one record by its unique type and asks a field it shows', () => {
    const challenges = ofKind('record-recall');
    expect(challenges.length).toBeGreaterThan(30);
    for (const c of challenges) {
      const { records, ask } = c.content;
      const profile = CODE_MEMORY_LEVELS[c.level].records;
      expect(records).toHaveLength(profile.recordCount);
      expect(new Set(records.map((r) => r.type)).size).toBe(records.length);
      records.forEach((r) => {
        expect(r.fields).toHaveLength(profile.fieldCount);
      });
      const record = records[ask.recordIndex];
      expect(en(c.prompt)).toContain(`${record?.type} record`);
      expect(['true', 'false']).not.toContain(valueOf(record, ask.field));
      expectOnlyCorrectOption(c, valueOf(record, ask.field));
    }
  });

  it('record-recall: high similarity makes ids digit permutations of each other', () => {
    for (const c of ofKind('record-recall').filter(
      (c) => CODE_MEMORY_LEVELS[c.level].records.similarity === 'high',
    )) {
      const digits = c.content.records.map((r) =>
        (valueOf(r, 'id') ?? '').split('').sort().join(''),
      );
      expect(new Set(digits).size).toBe(1);
    }
  });

  it('cross-reference: exactly one record has the key and its target is the answer', () => {
    const challenges = ofKind('cross-reference');
    expect(challenges.length).toBeGreaterThan(20);
    for (const c of challenges) {
      const { records, ask } = c.content;
      expect(ask.keyField).not.toBe(ask.targetField);
      const matches = records.filter((r) => valueOf(r, ask.keyField) === ask.keyValue);
      expect(matches).toHaveLength(1);
      expect(en(c.prompt)).toContain(`${ask.keyField} was ${ask.keyValue}`);
      expectOnlyCorrectOption(c, valueOf(matches[0], ask.targetField));
      // Every other record's target value is a distinct, visible lure.
      const targets = records.map((r) => valueOf(r, ask.targetField));
      expect(new Set(targets).size).toBe(records.length);
    }
  });

  it('foreign-key-join: the key finds one parent, whose id finds one child, never aligned', () => {
    const challenges = ofKind('foreign-key-join');
    expect(challenges.length).toBeGreaterThan(12);
    for (const c of challenges) {
      const { parents, children, foreignKey, ask } = c.content;
      const parentMatches = parents.filter((p) => valueOf(p, ask.keyField) === ask.keyValue);
      expect(parentMatches).toHaveLength(1);
      const parentId = valueOf(parentMatches[0], 'id');
      const childMatches = children.filter((ch) => valueOf(ch, foreignKey) === parentId);
      expect(childMatches).toHaveLength(1);
      expectOnlyCorrectOption(c, valueOf(childMatches[0], ask.targetField));
      // No positional shortcut: no child sits in the same row as the parent it points to.
      children.forEach((child, row) => {
        expect(parents.findIndex((p) => valueOf(p, 'id') === valueOf(child, foreignKey))).not.toBe(
          row,
        );
      });
      const parentIds = parents.map((p) => valueOf(p, 'id'));
      expect(children.some((ch) => parentIds.includes(valueOf(ch, 'id')))).toBe(false);
    }
  });

  it('sequence-recall: the answer follows from the calls and the question type', () => {
    const challenges = ofKind('sequence-recall');
    expect(challenges.length).toBeGreaterThan(40);
    for (const c of challenges) {
      const { calls, ask } = c.content;
      const profile = CODE_MEMORY_LEVELS[c.level].sequence;
      expect(calls).toHaveLength(profile.sequenceLength);
      expect(new Set(calls).size).toBe(calls.length);
      expect(profile.questions).toContain(ask.type);
      if (ask.type === 'order') {
        expect(c.response.format).toBe('ordering');
        if (c.response.format !== 'ordering') continue;
        const { items } = c.response.question;
        const label = (id: string) => items.find((item) => item.id === id)?.label;
        expect(c.response.solution.order.map(label)).toEqual(calls);
        expect(items.map((item) => item.label)).not.toEqual(calls);
      } else {
        const truth = ask.type === 'position' ? calls[ask.index] : calls[ask.index + 1];
        if (ask.type === 'successor') {
          expect(en(c.prompt)).toContain(calls[ask.index]);
          expect(options(c)).not.toContain(calls[ask.index]);
        }
        expectOnlyCorrectOption(c, truth);
      }
    }
  });

  it('variable-state: the answer matches an independent trace and needs updated state', () => {
    const challenges = ofKind('variable-state');
    expect(challenges.length).toBeGreaterThan(40);
    for (const c of challenges) {
      const { lines, ask } = c.content;
      const profile = CODE_MEMORY_LEVELS[c.level].state;
      expect(lines).toHaveLength(profile.lineCount);
      const upTo = ask.afterLine ?? lines.length;
      const value = run(lines, upTo).get(ask.variable);
      expect(Number.isInteger(value)).toBe(true);
      expect(lines.slice(0, upTo).filter((l) => l.target === ask.variable).length).toBeGreaterThan(
        1,
      );
      for (let i = 1; i <= lines.length; i++)
        for (const v of run(lines, i).values()) expect(Math.abs(v)).toBeLessThanOrEqual(99);
      if (ask.afterLine !== null) {
        expect(profile.question).toBe('mixed');
        expect(run(lines, lines.length).get(ask.variable)).not.toBe(value);
      }
      if (profile.answer === 'numeric') expect(c.response).toMatchObject({ solution: { value } });
      else expectOnlyCorrectOption(c, String(value));
    }
  });

  it('position-recall: the target appears exactly once and the solution is its cell', () => {
    const challenges = ofKind('position-recall');
    expect(challenges.length).toBeGreaterThan(40);
    for (const c of challenges) {
      const { rows, cols, cells, target } = c.content;
      const grid = CODE_MEMORY_LEVELS[c.level].grid;
      const words = cells.filter((cell): cell is string => cell !== null);
      expect(cells).toHaveLength(rows * cols);
      expect(words).toHaveLength(grid.elementCount);
      expect(new Set(words).size).toBe(words.length);
      expect(c.response).toEqual({
        format: 'locate',
        question: { itemCount: rows * cols },
        solution: { index: cells.indexOf(target) },
      });
      if (grid.similarKeywords) {
        const family = KEYWORD_FAMILIES.find((f) => f.includes(target)) ?? [];
        expect(words.some((w) => w !== target && family.includes(w))).toBe(true);
      }
    }
  });

  it('writes an explanation that contains the answer', () => {
    for (const c of all) {
      const { response, content } = c;
      if (response.format === 'numeric')
        expect(en(c.explanation)).toContain(String(response.solution.value));
      else if (response.format === 'single-choice')
        expect(en(c.explanation)).toContain(solutionLabel(c));
      else if (response.format === 'ordering' && content.kind === 'sequence-recall')
        expect(en(c.explanation)).toContain(content.calls.join(' → '));
      else if (content.kind === 'position-recall') {
        const index = content.cells.indexOf(content.target);
        const where = `row ${Math.floor(index / content.cols) + 1}, column ${(index % content.cols) + 1}`;
        expect(en(c.explanation)).toContain(`${content.target} was in ${where}`);
      }
    }
  });
});
