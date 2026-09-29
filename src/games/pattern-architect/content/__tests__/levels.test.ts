import { validateLevelTable } from '@/domain/difficulty';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import { PATTERN_LEVELS } from '../levels';
import type { PatternKind } from '../types';

const levelsWith = (kind: PatternKind) =>
  DIFFICULTY_LEVELS.filter((level) => (PATTERN_LEVELS[level].kinds[kind] ?? 0) > 0);

describe('Pattern Architect — level table', () => {
  it('defines a coherent profile for every level 1–10', () => {
    expect(validateLevelTable(PATTERN_LEVELS)).toEqual([]);
  });

  it('never gets easier: abstraction, composition and time budgets are non-decreasing', () => {
    for (const level of DIFFICULTY_LEVELS.slice(1)) {
      const prev = PATTERN_LEVELS[(level - 1) as DifficultyLevel];
      const curr = PATTERN_LEVELS[level];
      expect(curr.abstractionLevel).toBeGreaterThanOrEqual(prev.abstractionLevel);
      expect(curr.complexity).toBeGreaterThanOrEqual(prev.complexity);
      expect(curr.transform.depth).toBeGreaterThanOrEqual(prev.transform.depth);
      expect(curr.tree.depth).toBeGreaterThanOrEqual(prev.tree.depth);
      expect(curr.structure.elementCount).toBeGreaterThanOrEqual(prev.structure.elementCount);
      expect(curr.timing.targetMs).toBeGreaterThanOrEqual(prev.timing.targetMs);
      expect(curr.timing.limitMs ?? 0).toBeGreaterThanOrEqual(prev.timing.limitMs ?? 0);
    }
  });

  it('composes from one rule at level 1 to three-step programs at the expert tier', () => {
    expect(PATTERN_LEVELS[1].complexity).toBe(1);
    expect(PATTERN_LEVELS[9].transform.depth).toBe(3);
    expect(PATTERN_LEVELS[10].transform.depth).toBe(3);
    expect(PATTERN_LEVELS[10].tree.depth).toBe(2);
    for (const level of levelsWith('transform-inference'))
      expect(PATTERN_LEVELS[level].transform.depth).toBeLessThanOrEqual(
        PATTERN_LEVELS[level].complexity,
      );
  });

  it('introduces hidden programs at the intermediate tier and structures at the advanced tier', () => {
    expect(levelsWith('number-sequence')).toEqual([1, 2, 3, 4, 5, 6]);
    expect(levelsWith('symbol-grid')).toEqual([1, 2, 3, 4, 5, 6]);
    expect(levelsWith('transform-inference')).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(levelsWith('structure-match')).toEqual([7, 8, 9, 10]);
    expect(levelsWith('tree-analogy')).toEqual([7, 8, 9, 10]);
  });

  it('keeps the look-alike (degree-preserving) graph distractors for the expert tier', () => {
    expect(
      DIFFICULTY_LEVELS.filter(
        (level) => PATTERN_LEVELS[level].structure.distractorMutation === 'degree-preserving',
      ),
    ).toEqual([9, 10]);
  });
});
