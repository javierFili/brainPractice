import type { PerformanceMetrics } from '../session/performanceMetrics';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import { createRuleBasedDifficulty } from './ruleBasedStrategy';

const strategy = createRuleBasedDifficulty();
const metrics = (
  accuracy: number,
  medianPace: number | null,
  attempted = 10,
): PerformanceMetrics => ({
  total: attempted,
  attempted,
  correct: Math.round(accuracy * attempted),
  incorrect: 0,
  timedOut: 0,
  skipped: 0,
  accuracy,
  averageResponseMs: null,
  medianResponseMs: null,
  fastestResponseMs: null,
  medianPace,
  longestStreak: 0,
  byKind: {},
  bySkill: {},
});
const next = (currentLevel: DifficultyLevel, performance: PerformanceMetrics) =>
  strategy.determineNextLevel({ currentLevel, performance });

describe('RuleBasedDifficultyStrategy', () => {
  it('promotes at exactly 90% accuracy and target pace', () => {
    expect(next(4, metrics(0.9, 1))).toMatchObject({ level: 5, direction: 'up' });
  });

  it('stays when accurate but slow, or when pace is unknown', () => {
    const slow = next(4, metrics(1, 1.01));
    expect(slow).toMatchObject({ level: 4, direction: 'stay' });
    expect(slow.reason).toMatch(/pace/);
    expect(next(4, metrics(1, null))).toMatchObject({ level: 4, direction: 'stay' });
  });

  it('stays between the thresholds, including exactly 60%', () => {
    expect(next(4, metrics(0.6, 0.5))).toMatchObject({ level: 4, direction: 'stay' });
    expect(next(4, metrics(0.89, 0.5))).toMatchObject({ level: 4, direction: 'stay' });
  });

  it('demotes below 60% accuracy', () => {
    expect(next(4, metrics(0.59, 0.5))).toMatchObject({ level: 3, direction: 'down' });
    expect(next(4, metrics(0, null))).toMatchObject({ level: 3, direction: 'down' });
  });

  it('clamps at levels 1 and 10', () => {
    expect(next(10, metrics(1, 0.1))).toMatchObject({ level: 10, direction: 'stay' });
    expect(next(1, metrics(0, null))).toMatchObject({ level: 1, direction: 'stay' });
  });

  it('does not change level without enough evidence', () => {
    const early = next(4, metrics(1, 0.1, 2));
    expect(early).toMatchObject({ level: 4, direction: 'stay' });
    expect(early.reason).toMatch(/Not enough/);
  });

  it('accepts custom thresholds and rejects inconsistent ones', () => {
    const lenient = createRuleBasedDifficulty({ promoteAccuracy: 0.7, promoteMaxPace: 2 });
    expect(
      lenient.determineNextLevel({ currentLevel: 2, performance: metrics(0.7, 1.5) }).level,
    ).toBe(3);
    expect(() => createRuleBasedDifficulty({ promoteAccuracy: 0.5, demoteAccuracy: 0.6 })).toThrow(
      RangeError,
    );
  });
});
