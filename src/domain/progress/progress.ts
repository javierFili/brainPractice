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

export const PROGRESS_SCHEMA_VERSION = 2;
/** A level counts as cleared at this performance index (decision D2). */
export const CLEARED_PERFORMANCE_INDEX = 70;
export const MAX_RECENT_SESSIONS = 200;

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

/**
 * Lifetime counters, kept apart from the capped session list so totals never shrink. Sessions in
 * which nothing was answered (opened and closed) are not practice and are not counted.
 */
export interface PracticeTotals {
  readonly sessions: number;
  readonly practiceMs: number;
}

export interface UserProgress {
  readonly schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  readonly totals: PracticeTotals;
  readonly games: Readonly<Record<string, GameProgress>>;
  /** Most recent first. */
  readonly recentSessions: readonly SessionSummary[];
  /** Most recent first; absent in progress saved before the assessment existed. */
  readonly assessments?: readonly AssessmentSummary[];
}

export const emptyProgress = (): UserProgress => ({
  schemaVersion: PROGRESS_SCHEMA_VERSION,
  totals: { sessions: 0, practiceMs: 0 },
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
  const practised = result.metrics.attempted > 0;
  const totals = practised
    ? {
        sessions: progress.totals.sessions + 1,
        practiceMs: progress.totals.practiceMs + Math.max(0, result.durationMs),
      }
    : progress.totals;
  if (!result.completed) return { ...progress, totals, recentSessions };

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
    totals,
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

/** Level n + 1 opens when level n was completed with at least this performance index… */
export const UNLOCK_PERFORMANCE_INDEX = 50;
/** …or after this many completed sessions of level n, so a low score never blocks anyone. */
export const UNLOCK_AFTER_PLAYS = 3;

/**
 * Transparent unlocking: level 1 is always open; every other level opens from the level below
 * it (see the constants above). Free play opens everything.
 */
export function isLevelUnlocked(
  game: GameProgress | undefined,
  level: DifficultyLevel,
  freePlay = false,
): boolean {
  if (freePlay || level === MIN_LEVEL) return true;
  const below = game?.[stepLevel(level, -1)];
  return (
    below !== undefined &&
    (below.bestPerformanceIndex >= UNLOCK_PERFORMANCE_INDEX || below.plays >= UNLOCK_AFTER_PLAYS)
  );
}

/** Levels that are open; always a prefix 1…n because each level opens from the one below. */
export function unlockedLevels(
  game: GameProgress | undefined,
  freePlay = false,
): DifficultyLevel[] {
  const open: DifficultyLevel[] = [];
  for (const level of DIFFICULTY_LEVELS) {
    if (!isLevelUnlocked(game, level, freePlay)) break;
    open.push(level);
  }
  return open;
}

/** Port: the domain never knows where progress lives (localStorage today, an API later). */
export type ProgressRepository = Repository<UserProgress>;
