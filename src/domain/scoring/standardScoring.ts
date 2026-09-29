import type { DifficultyLevel } from '../shared/difficultyLevel';
import type { ChallengeRecord } from '../session/challengeRecord';
import type {
  ChallengePoints,
  ChallengeScoringInput,
  ScoringConfig,
  ScoringStrategy,
  SessionScore,
} from './scoring';

/** Defaults documented in ARCHITECTURE.md §7. */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  basePoints: 100,
  levelStep: 0.25,
  maxSpeedBonus: 0.5,
  streakStep: 0.05,
  maxStreakBonus: 0.25,
  retryDecay: 0.5,
  wrongAnswerPenalty: 0.25,
  accuracyWeight: 0.75,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const round2 = (value: number) => Math.round(value * 100) / 100;

function assertConfig(config: ScoringConfig): void {
  const fractions = [
    'maxSpeedBonus',
    'streakStep',
    'maxStreakBonus',
    'retryDecay',
    'wrongAnswerPenalty',
    'accuracyWeight',
  ] as const;
  const invalid = [
    ...(['basePoints', 'levelStep'] as const).filter(
      (key) => !(Number.isFinite(config[key]) && config[key] >= 0),
    ),
    ...fractions.filter((key) => !(config[key] >= 0 && config[key] <= 1)),
  ];
  if (config.basePoints <= 0) invalid.push('basePoints');
  if (invalid.length > 0)
    throw new RangeError(`Invalid scoring config: ${[...new Set(invalid)].join(', ')}`);
}

/** Fraction of the target time saved: 1 at t = 0, 0 at or beyond the target. */
export const paceScore = (responseTimeMs: number, targetMs: number) =>
  clamp01(1 - responseTimeMs / targetMs);

/**
 * m(L) = 1 + k·(L − 1)
 * correct:   B · m(L) · (1 + s + z) · a   with s = Smax·pace, z = min(σ·streak, σmax), a = (1 − r)^(attempts − 1)
 * incorrect: −P · B        timed-out / skipped: 0
 */
export function createStandardScoring(overrides: Partial<ScoringConfig> = {}): ScoringStrategy {
  const config: ScoringConfig = { ...DEFAULT_SCORING_CONFIG, ...overrides };
  assertConfig(config);
  const multiplier = (level: DifficultyLevel) => 1 + config.levelStep * (level - 1);
  const streakBonus = (streakBefore: number) =>
    Math.min(config.streakStep * streakBefore, config.maxStreakBonus);

  function scoreChallenge(input: ChallengeScoringInput): ChallengePoints {
    const difficultyMultiplier = multiplier(input.level);
    const none = {
      difficultyMultiplier,
      speedBonus: 0,
      streakBonus: 0,
      attemptFactor: 1,
      penalty: 0,
      total: 0,
    };
    if (input.outcome === 'incorrect') {
      const penalty = config.wrongAnswerPenalty * config.basePoints;
      return { ...none, penalty, total: -penalty };
    }
    if (input.outcome !== 'correct' || input.responseTimeMs === null) return none;

    if (!Number.isInteger(input.attempts) || input.attempts < 1) {
      throw new RangeError(`attempts must be a positive integer, got ${input.attempts}`);
    }
    const speedBonus = config.maxSpeedBonus * paceScore(input.responseTimeMs, input.targetMs);
    const streak = streakBonus(input.streakBefore);
    const attemptFactor = (1 - config.retryDecay) ** (input.attempts - 1);
    const total =
      config.basePoints * difficultyMultiplier * (1 + speedBonus + streak) * attemptFactor;
    return {
      difficultyMultiplier,
      speedBonus,
      streakBonus: streak,
      attemptFactor,
      penalty: 0,
      total: round2(total),
    };
  }

  /**
   * total            = max(0, Σ points)
   * maxPossible      = Σᵢ B · m(L) · (1 + Smax + min(σ·i, σmax))   (all correct, instant, full streak)
   * accuracy         = correct / attempted
   * speedIndex       = Σ_correct pace / attempted   (speed only counts on correct answers)
   * performanceIndex = round(100 · (w · accuracy + (1 − w) · speedIndex))
   */
  function scoreSession(records: readonly ChallengeRecord[], level: DifficultyLevel): SessionScore {
    const attempted = records.filter((r) => r.outcome !== 'skipped');
    const correct = attempted.filter((r) => r.outcome === 'correct');
    const total = round2(
      Math.max(
        0,
        records.reduce((sum, r) => sum + r.points.total, 0),
      ),
    );
    const maxPossible = round2(
      records.reduce(
        (sum, _, i) =>
          sum + config.basePoints * multiplier(level) * (1 + config.maxSpeedBonus + streakBonus(i)),
        0,
      ),
    );
    if (attempted.length === 0) return { total, maxPossible, performanceIndex: 0 };

    const accuracy = correct.length / attempted.length;
    const speedIndex =
      correct.reduce((sum, r) => sum + paceScore(r.responseTimeMs ?? r.targetMs, r.targetMs), 0) /
      attempted.length;
    const performanceIndex = Math.round(
      100 * (config.accuracyWeight * accuracy + (1 - config.accuracyWeight) * speedIndex),
    );
    return { total, maxPossible, performanceIndex };
  }

  return { scoreChallenge, scoreSession };
}
