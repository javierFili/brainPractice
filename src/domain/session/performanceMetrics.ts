import type { ProgrammingSkill } from '../shared/programmingSkill';
import type { ChallengeRecord } from './challengeRecord';

export interface Tally {
  readonly total: number;
  readonly correct: number;
}

export interface PerformanceMetrics {
  readonly total: number;
  /** Challenges the player actually faced: total − skipped. */
  readonly attempted: number;
  readonly correct: number;
  readonly incorrect: number;
  readonly timedOut: number;
  readonly skipped: number;
  /** correct / attempted; 0 when nothing was attempted (check `attempted` before displaying). */
  readonly accuracy: number;
  /** Over answers given in time (correct and incorrect); null when there are none. */
  readonly averageResponseMs: number | null;
  /** Robust to outliers; the figure used by adaptive difficulty. */
  readonly medianResponseMs: number | null;
  readonly fastestResponseMs: number | null;
  readonly longestStreak: number;
  readonly byKind: Readonly<Record<string, Tally>>;
  readonly bySkill: Readonly<Partial<Record<ProgrammingSkill, Tally>>>;
}

function median(sorted: readonly number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid] as number;
  return sorted.length % 2 === 1 ? upper : ((sorted[mid - 1] as number) + upper) / 2;
}

function longestStreak(records: readonly ChallengeRecord[]): number {
  let best = 0;
  let current = 0;
  for (const { outcome } of records) {
    current = outcome === 'correct' ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

function addTally(tally: Tally | undefined, correct: boolean): Tally {
  return { total: (tally?.total ?? 0) + 1, correct: (tally?.correct ?? 0) + (correct ? 1 : 0) };
}

export function computeMetrics(records: readonly ChallengeRecord[]): PerformanceMetrics {
  const count = (outcome: ChallengeRecord['outcome']) =>
    records.filter((r) => r.outcome === outcome).length;
  const correct = count('correct');
  const skipped = count('skipped');
  const attempted = records.length - skipped;

  const times = records
    .map((r) => r.responseTimeMs)
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b);

  const byKind: Record<string, Tally> = {};
  const bySkill: Partial<Record<ProgrammingSkill, Tally>> = {};
  for (const record of records) {
    if (record.outcome === 'skipped') continue;
    const isCorrect = record.outcome === 'correct';
    byKind[record.kind] = addTally(byKind[record.kind], isCorrect);
    for (const skill of new Set(record.skills))
      bySkill[skill] = addTally(bySkill[skill], isCorrect);
  }

  return {
    total: records.length,
    attempted,
    correct,
    incorrect: count('incorrect'),
    timedOut: count('timed-out'),
    skipped,
    accuracy: attempted === 0 ? 0 : correct / attempted,
    averageResponseMs:
      times.length === 0 ? null : times.reduce((sum, t) => sum + t, 0) / times.length,
    medianResponseMs: median(times),
    fastestResponseMs: times[0] ?? null,
    longestStreak: longestStreak(records),
    byKind,
    bySkill,
  };
}
