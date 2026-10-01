import {
  DIFFICULTY_LEVELS,
  MIN_LEVEL,
  stepLevel,
  type DifficultyLevel,
} from '../shared/difficultyLevel';
import type { Seed } from '../random/seed';
import type { AssessmentResult } from '../assessment/assessment';
import type { CognitiveArea } from '../shared/cognitiveArea';
import type { GameResult } from '../session/gameResult';
import type { Repository } from '../storage/repository';

export const PROGRESS_SCHEMA_VERSION = 1;
/** A level counts as cleared at this performance index (decision D2). */
export const CLEARED_PERFORMANCE_INDEX = 70;
export const MAX_RECENT_SESSIONS = 50;

export interface LevelRecord {
  /** Completed sessions, assisted included. */
  readonly plays: number;
  readonly bestScore: number;
  readonly bestAccuracy: number;
  readonly bestPerformanceIndex: number;
  readonly bestMedianResponseMs: number | null;
  readonly lastPlayedAt: number;
}

export interface SessionSummary {
  readonly gameId: string;
  readonly level: DifficultyLevel;
  readonly seed: Seed;
  readonly score: number;
  readonly accuracy: number;
  readonly performanceIndex: number;
  readonly completed: boolean;
  readonly assisted: boolean;
  readonly endedAt: number;
  readonly durationMs: number;
}

export interface AssessmentSummary {
  readonly assessmentId: string;
  readonly endedAt: number;
  readonly overall: number;
  readonly areas: Readonly<Partial<Record<CognitiveArea, number>>>;
}

export const MAX_ASSESSMENTS = 20;

export type GameProgress = Readonly<Partial<Record<DifficultyLevel, LevelRecord>>>;

export interface UserProgress {
  readonly schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  readonly games: Readonly<Record<string, GameProgress>>;
  /** Most recent first. */
  readonly recentSessions: readonly SessionSummary[];
  /** Most recent first; absent in progress saved before the assessment existed. */
  readonly assessments?: readonly AssessmentSummary[];
}

export const emptyProgress = (): UserProgress => ({
  schemaVersion: PROGRESS_SCHEMA_VERSION,
  games: {},
  recentSessions: [],
});

const better = (
  current: number | null,
  candidate: number | null,
  lowerIsBetter = false,
): number | null => {
  if (candidate === null) return current;
  if (current === null) return candidate;
  return lowerIsBetter ? Math.min(current, candidate) : Math.max(current, candidate);
};

/**
 * Pure progress update. Every finished session is listed in `recentSessions`; only completed
 * sessions count as plays, and only completed non-assisted sessions can set records.
 */
export function applySessionResult(progress: UserProgress, result: GameResult): UserProgress {
  const summary: SessionSummary = {
    gameId: result.gameId,
    level: result.level,
    seed: result.seed,
    score: result.score.total,
    accuracy: result.metrics.accuracy,
    performanceIndex: result.score.performanceIndex,
    completed: result.completed,
    assisted: result.assisted,
    endedAt: result.endedAt,
    durationMs: result.durationMs,
  };
  const recentSessions = [summary, ...progress.recentSessions].slice(0, MAX_RECENT_SESSIONS);
  if (!result.completed) return { ...progress, recentSessions };

  const game = progress.games[result.gameId] ?? {};
  const previous = game[result.level];
  const counts = !result.assisted;
  const record: LevelRecord = {
    plays: (previous?.plays ?? 0) + 1,
    bestScore: counts
      ? Math.max(previous?.bestScore ?? 0, result.score.total)
      : (previous?.bestScore ?? 0),
    bestAccuracy: counts
      ? Math.max(previous?.bestAccuracy ?? 0, result.metrics.accuracy)
      : (previous?.bestAccuracy ?? 0),
    bestPerformanceIndex: counts
      ? Math.max(previous?.bestPerformanceIndex ?? 0, result.score.performanceIndex)
      : (previous?.bestPerformanceIndex ?? 0),
    bestMedianResponseMs: counts
      ? better(previous?.bestMedianResponseMs ?? null, result.metrics.medianResponseMs, true)
      : (previous?.bestMedianResponseMs ?? null),
    lastPlayedAt: result.endedAt,
  };
  return {
    ...progress,
    recentSessions,
    games: { ...progress.games, [result.gameId]: { ...game, [result.level]: record } },
  };
}

/** Adds an assessment summary (most recent first). Assessment steps never touch level records. */
export function applyAssessmentResult(
  progress: UserProgress,
  result: AssessmentResult,
): UserProgress {
  const areas: Partial<Record<CognitiveArea, number>> = {};
  for (const [area, score] of Object.entries(result.profile)) {
    if (area !== 'overall' && score !== null) areas[area as CognitiveArea] = score.value;
  }
  const summary: AssessmentSummary = {
    assessmentId: result.assessmentId,
    endedAt: result.endedAt,
    overall: result.profile.overall.value,
    areas,
  };
  return {
    ...progress,
    assessments: [summary, ...(progress.assessments ?? [])].slice(0, MAX_ASSESSMENTS),
  };
}

export const isLevelCleared = (record: LevelRecord | undefined): boolean =>
  (record?.bestPerformanceIndex ?? 0) >= CLEARED_PERFORMANCE_INDEX;

/** The level right after the highest cleared one (levels stay open, this is only a suggestion). */
export function suggestedLevel(game: GameProgress | undefined): DifficultyLevel {
  const cleared = DIFFICULTY_LEVELS.filter((level) => isLevelCleared(game?.[level]));
  const highest = cleared.at(-1);
  return highest === undefined ? MIN_LEVEL : stepLevel(highest, 1);
}

/** Port: the domain never knows where progress lives (localStorage today, an API later). */
export type ProgressRepository = Repository<UserProgress>;
