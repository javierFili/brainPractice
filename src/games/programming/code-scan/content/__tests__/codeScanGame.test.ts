import { evaluateAnswer, type Answer } from '@/domain/challenge';
import { validateLevelTable } from '@/domain/difficulty';
import { createGameRegistry, generateChallenge } from '@/domain/game';
import { createStandardScoring } from '@/domain/scoring';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import { codeScanGame } from '../definition';
import { lineText } from '../format';
import { ARRAYS, ROUTINES, SCALARS } from '../generators/snippets';
import { CODE_SCAN_LEVELS } from '../levels';
import type { CodeScanKind, MutationCategory, SpeedChallenge } from '../types';
import { en } from '@/test/i18n';

const SEEDS = Array.from({ length: 30 }, (_, i) => i * 7919 + 1);
const generate = (level: DifficultyLevel, seed: number) =>
  generateChallenge(codeScanGame, { level, seed });
const all = DIFFICULTY_LEVELS.flatMap((level) => SEEDS.map((seed) => generate(level, seed)));
const ofKind = (kind: CodeScanKind) => all.filter((c) => c.content.kind === kind);

// ── Independent checks: they re-read the rendered text instead of trusting generator metadata ──

const OPERATORS = new Set(['<', '<=', '>', '>=', '=', '≠', '+', '-', '*', 'and', 'or']);
const tokenize = (text: string) => text.match(/[a-z]+|\d+|<=|>=|←|≠|[<>=+\-*()[\],]/g) ?? [];

/** Damerau–Levenshtein distance (optimal string alignment). */
function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  const at = (i: number, j: number) => d[i]?.[j] ?? Infinity;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        best = Math.min(best, at(i - 2, j - 2) + 1);
      (d[i] as number[])[j] = best;
    }
  return at(a.length, b.length);
}

/** Collapses characters and pairs that can look alike in some fonts. */
const lookAlike = (s: string) =>
  s
    .replace(/rn/g, 'm')
    .replace(/cl/g, 'd')
    .replace(/vv/g, 'w')
    .replace(/[1I|]/g, 'l')
    .replace(/[0O]/g, 'o');

interface Diff {
  readonly line: number;
  /** null when a token was inserted. */
  readonly before: string | null;
  readonly after: string;
}

/** Every line that differs, and for each the single token edit that explains it (or null). */
function diff(c: SpeedChallenge): { lines: number[]; edit: Diff | null } {
  const { original, copy } = c.content;
  expect(copy).toHaveLength(original.length);
  const lines = original.flatMap((line, i) => {
    const other = copy[i];
    expect(other?.indent).toBe(line.indent);
    return other && lineText(other) === lineText(line) ? [] : [i];
  });
  if (lines.length !== 1) return { lines, edit: null };
  const line = lines[0] as number;
  const a = tokenize(lineText(original[line] as (typeof original)[number]));
  const b = tokenize(lineText(copy[line] as (typeof copy)[number]));
  if (a.length === b.length) {
    const positions = a.flatMap((token, k) => (token === b[k] ? [] : [k]));
    if (positions.length !== 1) return { lines, edit: null };
    const k = positions[0] as number;
    return { lines, edit: { line, before: a[k] as string, after: b[k] as string } };
  }
  if (b.length === a.length + 1) {
    const k = b.findIndex((token, i) => token !== a[i]);
    const without = [...b.slice(0, k), ...b.slice(k + 1)];
    if (without.join(' ') === a.join(' '))
      return { lines, edit: { line, before: null, after: b[k] as string } };
  }
  return { lines, edit: null };
}

function classify(c: SpeedChallenge, { before, after }: Diff): MutationCategory | 'unknown' {
  if (before === null) return after === 'not' ? 'negation' : 'unknown';
  if (/^\d+$/.test(before) && /^\d+$/.test(after)) return 'number';
  if (OPERATORS.has(before) && OPERATORS.has(after)) return 'operator';
  if (/^[a-z]+$/.test(before) && /^[a-z]+$/.test(after)) {
    const originalTokens = new Set(c.content.original.flatMap((l) => tokenize(lineText(l))));
    if (originalTokens.has(after)) return 'variable';
    return editDistance(before, after) === 1 ? 'typo' : 'unknown';
  }
  return 'unknown';
}

const solutionLabel = (c: SpeedChallenge) =>
  c.response.format === 'single-choice'
    ? c.response.question.options.find(
        (o) => o.id === (c.response.solution as { optionId: string }).optionId,
      )?.label
    : undefined;
const solutionText = (c: SpeedChallenge) => {
  const label = solutionLabel(c);
  return label === undefined ? undefined : en(label);
};

function correctAnswer(c: SpeedChallenge): Answer {
  const { response } = c;
  if (response.format === 'single-choice')
    return { format: 'single-choice', optionId: response.solution.optionId };
  if (response.format === 'locate') return { format: 'locate', index: response.solution.index };
  throw new Error(`Code Scan does not use ${response.format}`);
}

// ── Level table ─────────────────────────────────────────────────────────────────────────────────

describe('Code Scan — level table', () => {
  it('defines a coherent profile for every level 1–10', () => {
    expect(validateLevelTable(CODE_SCAN_LEVELS)).toEqual([]);
  });

  it('never gets easier: longer, noisier, finer and faster level after level', () => {
    for (const level of DIFFICULTY_LEVELS.slice(1)) {
      const prev = CODE_SCAN_LEVELS[(level - 1) as DifficultyLevel];
      const curr = CODE_SCAN_LEVELS[level];
      expect(curr.elementCount).toBeGreaterThanOrEqual(prev.elementCount);
      expect(curr.visualNoise).toBeGreaterThanOrEqual(prev.visualNoise);
      expect(curr.fineShare).toBeGreaterThanOrEqual(prev.fineShare);
      expect(curr.complexity).toBeGreaterThanOrEqual(prev.complexity);
      expect(curr.timing.limitMs).toBeLessThanOrEqual(prev.timing.limitMs as number);
      expect(prev.distractors.every((category) => curr.distractors.includes(category))).toBe(true);
    }
  });

  it('introduces locating at level 2, classifying at level 7 and unhinted classifying at level 9', () => {
    const levelsWith = (kind: CodeScanKind) =>
      DIFFICULTY_LEVELS.filter((l) => (CODE_SCAN_LEVELS[l].kinds[kind] ?? 0) > 0);
    expect(levelsWith('find-the-change')[0]).toBe(2);
    expect(levelsWith('classify-the-change')).toEqual([7, 8, 9, 10]);
    expect(DIFFICULTY_LEVELS.filter((l) => CODE_SCAN_LEVELS[l].highlightChange)).toEqual([7, 8]);
  });

  it('uses name pools without near-duplicates or look-alike characters', () => {
    const names = [...SCALARS, ...ARRAYS, ...ROUTINES];
    for (const a of names) {
      expect(a).toMatch(/^[a-z]+$/);
      for (const b of names) if (a !== b) expect(editDistance(a, b)).toBeGreaterThanOrEqual(2);
    }
  });
});

// ── Generated content ───────────────────────────────────────────────────────────────────────────

describe('Code Scan — generated content', () => {
  it('is deterministic per (level, seed) and varies with the seed', () => {
    for (const level of [1, 5, 10] as const) {
      expect(generate(level, 42)).toEqual(generate(level, 42));
      expect(generate(level, 42).content).not.toEqual(generate(level, 43).content);
    }
  });

  it('only produces kinds allowed by the level, with the level timing and snippet length', () => {
    for (const c of all) {
      const profile = CODE_SCAN_LEVELS[c.level];
      expect(profile.kinds[c.content.kind]).toBeGreaterThan(0);
      expect(c.timing).toEqual(profile.timing);
      expect(c.content.original).toHaveLength(profile.elementCount);
    }
  });

  it('accepts its own solution for every challenge', () => {
    for (const c of all)
      expect(evaluateAnswer(c.response, correctAnswer(c))).toEqual({ ok: true, value: true });
  });

  it('changes are a single token of a single line, of an allowed category, never a font trick', () => {
    for (const c of all) {
      const { lines, edit } = diff(c);
      if (lines.length === 0) continue;
      expect(lines).toHaveLength(1);
      expect(edit).not.toBeNull();
      const { before, after } = edit as Diff;
      expect(CODE_SCAN_LEVELS[c.level].distractors).toContain(classify(c, edit as Diff));
      if (before !== null) expect(lookAlike(before)).not.toBe(lookAlike(after));
      if (before !== null && /^[a-z]+$/.test(before)) expect(after).toMatch(/^[a-z]+$/);
      if (before !== null && /^\d+$/.test(before)) expect(after).toMatch(/^\d+$/);
    }
  });

  it('same-or-different: the answer matches actual equality, and both answers occur', () => {
    const challenges = ofKind('same-or-different');
    const identical = challenges.filter((c) => diff(c).lines.length === 0);
    expect(identical.length / challenges.length).toBeGreaterThan(0.3);
    expect(identical.length / challenges.length).toBeLessThan(0.7);
    for (const c of challenges)
      expect(solutionText(c)).toBe(diff(c).lines.length === 0 ? 'Identical' : 'Different');
  });

  it('find-the-change: exactly one line differs and it is the solution', () => {
    const challenges = ofKind('find-the-change');
    expect(challenges.length).toBeGreaterThan(50);
    for (const c of challenges) {
      expect(c.response).toMatchObject({
        format: 'locate',
        question: { itemCount: c.content.copy.length },
      });
      expect(diff(c).lines).toEqual([(c.response.solution as { index: number }).index]);
    }
  });

  it('classify-the-change: the answer is the category of the actual edit, never an ambiguous one', () => {
    const challenges = ofKind('classify-the-change');
    const seen = new Set<string>();
    for (const c of challenges) {
      const { lines, edit } = diff(c);
      const category = classify(c, edit as Diff);
      seen.add(category);
      expect((c.response.solution as { optionId: string }).optionId).toBe(category);
      expect(c.response.format === 'single-choice' && c.response.question.options).toHaveLength(5);
      // `=` ↔ `≠` reads as a negation too, so it is never asked to be classified.
      expect([edit?.before, edit?.after].sort()).not.toEqual(['=', '≠']);
      const highlight =
        c.content.kind === 'classify-the-change' ? c.content.highlightLine : undefined;
      expect(highlight).toBe(CODE_SCAN_LEVELS[c.level].highlightChange ? lines[0] : null);
    }
    expect([...seen].sort()).toEqual(['negation', 'number', 'operator', 'typo', 'variable']);
  });

  it('writes an explanation that contains the answer', () => {
    for (const c of all) {
      const answer =
        c.response.format === 'locate' ? `Line ${c.response.solution.index + 1}` : solutionText(c);
      expect(en(c.explanation)).toContain(answer);
    }
  });

  it('hides most changes among look-alike lines at expert levels', () => {
    const expert = all.filter((c) => c.level >= 9 && diff(c).lines.length === 1);
    const inRun = expert.filter((c) => {
      const line = diff(c).lines[0] as number;
      const shape = (i: number) => {
        const l = c.content.original[i];
        return l ? tokenize(lineText(l)).map((t) => (/^\d+$/.test(t) ? '#' : t)).length : -1;
      };
      return shape(line - 1) === shape(line) || shape(line + 1) === shape(line);
    });
    expect(inRun.length / expert.length).toBeGreaterThan(0.5);
  });

  // Content code may not read the clock; the test timeout is the budget: 100 × 20 ms.
  it('generates a level-10 challenge in well under 20 ms', () => {
    for (let seed = 0; seed < 100; seed++) expect(generate(10, seed).level).toBe(10);
  }, 2000);
});

describe('Code Scan — definition', () => {
  it('registers as a speed game whose scoring weighs time more than the default', () => {
    expect(() => createGameRegistry([codeScanGame])).not.toThrow();
    expect(codeScanGame).toMatchObject({ id: 'code-scan', area: 'speed' });
    expect(en(codeScanGame.name)).toBe('Code Comparison');
    const scoring = createStandardScoring(codeScanGame.scoring);
    const input = {
      outcome: 'correct',
      level: 1,
      targetMs: 8000,
      streakBefore: 0,
      attempts: 1,
    } as const;
    const fast = scoring.scoreChallenge({ ...input, responseTimeMs: 0 });
    expect(fast.speedBonus).toBe(1);
    expect(fast.total).toBeGreaterThan(
      createStandardScoring().scoreChallenge({ ...input, responseTimeMs: 0 }).total,
    );
  });
});
