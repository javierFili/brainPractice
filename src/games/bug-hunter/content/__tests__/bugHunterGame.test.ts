import { evaluateAnswer } from '@/domain/challenge';
import { validateLevelTable } from '@/domain/difficulty';
import { generateChallenge } from '@/domain/game';
import { deriveSeed, toSeed } from '@/domain/random';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import { bugHunterGame } from '../definition';
import { itemTexts } from '../format';
import { BUG_HUNTER_LEVELS } from '../levels';
import type { AttentionChallenge, BugHunterKind, CodeRule, DataRecord } from '../types';
import { oracle } from './oracle';

/** Seeds as a session derives them (`deriveSeed(sessionSeed, i)`). */
const SEEDS = Array.from({ length: 40 }, (_, i) => deriveSeed(toSeed(2026), i));
const generate = (level: DifficultyLevel, seed: number) =>
  generateChallenge(bugHunterGame, { level, seed });
const all = DIFFICULTY_LEVELS.flatMap((level) => SEEDS.map((seed) => generate(level, seed)));
const ofKind = (kind: BugHunterKind) => all.filter((c) => c.content.kind === kind);

const solutionOf = (challenge: AttentionChallenge) => {
  if (challenge.response.format !== 'locate') throw new Error('Bug Hunter always uses locate');
  return challenge.response.solution.index;
};
const recordsOf = (challenge: AttentionChallenge): readonly DataRecord[] =>
  challenge.content.kind === 'code-rule' ? [] : challenge.content.records;

describe('Bug Hunter — level table', () => {
  it('defines a coherent profile for every level 1–10', () => {
    expect(validateLevelTable(BUG_HUNTER_LEVELS)).toEqual([]);
  });

  it('never gets easier: items, rules, noise, decoys and time budgets are non-decreasing', () => {
    for (const level of DIFFICULTY_LEVELS.slice(1)) {
      const prev = BUG_HUNTER_LEVELS[(level - 1) as DifficultyLevel];
      const curr = BUG_HUNTER_LEVELS[level];
      expect(curr.elementCount).toBeGreaterThan(prev.elementCount);
      expect(curr.decisionCount).toBeGreaterThanOrEqual(prev.decisionCount);
      expect(curr.visualNoise).toBeGreaterThanOrEqual(prev.visualNoise);
      expect(curr.distractors).toBeGreaterThanOrEqual(prev.distractors);
      expect(curr.timing.limitMs).toBeGreaterThan(prev.timing.limitMs ?? 0);
      expect(curr.timing.targetMs).toBeGreaterThanOrEqual(prev.timing.targetMs);
      expect(curr.schemaFields.length).toBeGreaterThanOrEqual(prev.schemaFields.length);
    }
  });

  it('spans ~6 → 40+ items and 1 → 3 rules, with subtle bugs from level 3', () => {
    expect(BUG_HUNTER_LEVELS[1].elementCount).toBe(6);
    expect(BUG_HUNTER_LEVELS[10].elementCount).toBeGreaterThanOrEqual(40);
    expect(BUG_HUNTER_LEVELS[1].decisionCount).toBe(1);
    expect(BUG_HUNTER_LEVELS[10].decisionCount).toBe(3);
    expect(DIFFICULTY_LEVELS.filter((l) => BUG_HUNTER_LEVELS[l].violation === 'obvious')).toEqual([
      1, 2,
    ]);
    expect(DIFFICULTY_LEVELS.filter((l) => BUG_HUNTER_LEVELS[l].kinds['multi-rule'])).toEqual([
      5, 6, 7, 8, 9, 10,
    ]);
  });
});

describe('Bug Hunter — generated content', () => {
  it('is deterministic per (level, seed)', () => {
    for (const level of [1, 5, 10] as const)
      expect(generate(level, 42)).toEqual(generate(level, 42));
    expect(generate(10, 1)).not.toEqual(generate(10, 2));
  });

  it('only produces kinds allowed by the level, sized and timed by the level', () => {
    for (const c of all) {
      const profile = BUG_HUNTER_LEVELS[c.level];
      expect(profile.kinds[c.content.kind]).toBeGreaterThan(0);
      expect(c.timing).toEqual(profile.timing);
      expect(c.response).toMatchObject({ format: 'locate' });
      expect(itemTexts(c.content)).toHaveLength(profile.elementCount);
      expect(c.response.question).toEqual({ itemCount: profile.elementCount });
    }
  });

  it('covers every kind', () => {
    for (const kind of ['sequence-anomaly', 'schema-violation', 'code-rule', 'multi-rule'] as const)
      expect(ofKind(kind).length).toBeGreaterThan(15);
  });

  it('states as many rules as the level asks for (multi-rule always mixes at least two)', () => {
    for (const c of all) {
      const expected = BUG_HUNTER_LEVELS[c.level].decisionCount;
      if (c.content.kind === 'multi-rule')
        expect(c.content.rules.length).toBe(Math.max(2, expected));
      else expect(c.content.rules.length).toBe(expected);
    }
  });

  it('accepts its own solution and rejects every other item', () => {
    for (const c of all) {
      const index = solutionOf(c);
      expect(evaluateAnswer(c.response, { format: 'locate', index })).toEqual({
        ok: true,
        value: true,
      });
      const other = (index + 1) % itemTexts(c.content).length;
      expect(evaluateAnswer(c.response, { format: 'locate', index: other })).toEqual({
        ok: true,
        value: false,
      });
    }
  });

  it('has exactly one item breaking exactly one rule, found by an independent checker', () => {
    for (const c of all) {
      const hits = oracle(c.content);
      expect(hits, c.id).toHaveLength(1);
      expect(hits[0]?.index, c.id).toBe(solutionOf(c));
    }
  });

  it('code-rule: the program holds no bug of any unstated kind either', () => {
    const everyRule: CodeRule[] = [
      { type: 'defined-before-use' },
      { type: 'close-opened' },
      { type: 'write-while-open' },
      { type: 'camel-case' },
    ];
    for (const c of ofKind('code-rule')) {
      expect(oracle(c.content, everyRule).map((h) => h.index)).toEqual([solutionOf(c)]);
    }
  });

  it('explains the bug by item number and quotes the broken rule', () => {
    for (const c of all) {
      const n = solutionOf(c) + 1;
      expect(c.explanation).toMatch(new RegExp(`^Item ${n} is the bug: `));
      expect(c.explanation).toMatch(/It breaks (the rule|rule \d): /);
    }
  });

  it('builds near-misses: every range rule has a legal item sitting on a bound', () => {
    let checked = 0;
    for (const c of all) {
      if (c.content.kind === 'code-rule') continue;
      if (BUG_HUNTER_LEVELS[c.level].distractors < c.content.rules.length) continue;
      const bug = solutionOf(c);
      for (const rule of c.content.rules) {
        if (rule.type !== 'range') continue;
        checked++;
        const onBound = recordsOf(c).some(
          (r, i) => i !== bug && (r[rule.field] === rule.min || r[rule.field] === rule.max),
        );
        expect(onBound, c.id).toBe(true);
      }
    }
    expect(checked).toBeGreaterThan(10);
  });

  it('never repeats an identifier unless that duplicate is the stated bug', () => {
    const identifiers = ['id', 'email', 'user', 'req', 'seq'] as const;
    let checked = 0;
    // Includes the reported regression: three records with id 1000 at level 6.
    for (const c of [...all, generate(6, deriveSeed(toSeed(5), 1))]) {
      if (c.content.kind === 'code-rule') continue;
      const { rules, records, fields } = c.content;
      const hit = oracle(c.content)[0];
      const broken = hit === undefined ? undefined : rules[hit.rule];
      for (const field of identifiers.filter((f) => (fields as readonly string[]).includes(f))) {
        checked++;
        records.forEach((record, i) => {
          const repeated = records.slice(0, i).some((earlier) => earlier[field] === record[field]);
          if (!repeated) return;
          // The only allowed duplicate: the bug itself, under a stated unique/consecutive rule.
          expect(i, `${c.id} ${field}`).toBe(solutionOf(c));
          expect(broken, `${c.id} ${field}`).toMatchObject({ field });
          expect(['unique', 'consecutive']).toContain(broken?.type);
        });
      }
    }
    expect(checked).toBeGreaterThan(300);
  });

  it('breaks every rule of the pool at levels 7–10, not just a favourite one', () => {
    const broken = new Set<string>();
    for (const level of [7, 8, 9, 10] as const)
      for (let i = 0; i < 60; i++) {
        const c = generate(level, deriveSeed(toSeed(level * 1000), i));
        const hit = oracle(c.content)[0];
        const rule = hit === undefined ? undefined : c.content.rules[hit.rule];
        if (rule) broken.add(`${c.content.kind}:${'field' in rule ? rule.field : rule.type}`);
      }
    const profile = BUG_HUNTER_LEVELS[10];
    const expected = [
      ...profile.schemaFields.map((f) => `schema-violation:${f}`),
      ...['time', 'seq', 'req'].map((f) => `sequence-anomaly:${f}`),
      ...['time', 'seq', 'level', 'ms', 'implies'].map((f) => `multi-rule:${f}`),
      ...profile.codeRules.map((t) => `code-rule:${t}`),
    ];
    for (const key of expected) expect(broken, key).toContain(key);
  });

  it('never relies on look-alike characters in ids', () => {
    for (const c of all)
      for (const record of recordsOf(c)) {
        if (record.req !== undefined) expect(String(record.req)).toMatch(/^[a-f2-9]{4}$/);
      }
  });

  it('generates a level-10 challenge in well under 20 ms', () => {
    const start = performance.now();
    for (let seed = 0; seed < 50; seed++) generate(10, seed);
    expect((performance.now() - start) / 50).toBeLessThan(20);
  });
});
