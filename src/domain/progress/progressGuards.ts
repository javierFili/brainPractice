import { isCognitiveArea } from '../shared/cognitiveArea';
import { isDifficultyLevel } from '../shared/difficultyLevel';
import { parseSeed } from '../random/seed';
import {
  PROGRESS_SCHEMA_VERSION,
  type AssessmentSummary,
  type LevelRecord,
  type SessionSummary,
  type UserProgress,
} from './progress';

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isNullableNumber = (value: unknown) => value === null || isFiniteNumber(value);

function isLevelRecord(value: unknown): value is LevelRecord {
  return (
    isObject(value) &&
    ['plays', 'bestScore', 'bestAccuracy', 'bestPerformanceIndex', 'lastPlayedAt'].every((key) =>
      isFiniteNumber(value[key]),
    ) &&
    isNullableNumber(value['bestMedianResponseMs'])
  );
}

function isSessionSummary(value: unknown): value is SessionSummary {
  return (
    isObject(value) &&
    typeof value['gameId'] === 'string' &&
    isDifficultyLevel(value['level']) &&
    parseSeed(value['seed']).ok &&
    ['score', 'accuracy', 'performanceIndex', 'endedAt', 'durationMs'].every((key) =>
      isFiniteNumber(value[key]),
    ) &&
    typeof value['completed'] === 'boolean' &&
    typeof value['assisted'] === 'boolean'
  );
}

function isAssessmentSummary(value: unknown): value is AssessmentSummary {
  return (
    isObject(value) &&
    typeof value['assessmentId'] === 'string' &&
    isFiniteNumber(value['endedAt']) &&
    isFiniteNumber(value['overall']) &&
    isObject(value['areas']) &&
    Object.entries(value['areas']).every(
      ([area, score]) => isCognitiveArea(area) && isFiniteNumber(score),
    )
  );
}

/** Validates untrusted persisted data (e.g. edited or stale localStorage) before it reaches the domain. */
export function isUserProgress(value: unknown): value is UserProgress {
  if (!isObject(value) || value['schemaVersion'] !== PROGRESS_SCHEMA_VERSION) return false;
  const { games, recentSessions } = value;
  if (!Array.isArray(recentSessions) || !recentSessions.every(isSessionSummary) || !isObject(games))
    return false;
  const { assessments } = value;
  if (
    assessments !== undefined &&
    !(Array.isArray(assessments) && assessments.every(isAssessmentSummary))
  ) {
    return false;
  }
  return Object.values(games).every(
    (game) =>
      isObject(game) &&
      Object.entries(game).every(
        ([level, record]) => isDifficultyLevel(Number(level)) && isLevelRecord(record),
      ),
  );
}

export interface RecoveredProgress {
  readonly progress: UserProgress;
  /** Entries dropped because they were malformed; 0 means the data was intact. */
  readonly discarded: number;
}

/**
 * Salvages what can be trusted from persisted data instead of throwing everything away when one
 * entry is malformed. Returns null only when nothing is recoverable (not an object, or another
 * schema version, which needs a migration rather than a guess).
 */
export function recoverUserProgress(value: unknown): RecoveredProgress | null {
  if (!isObject(value) || value['schemaVersion'] !== PROGRESS_SCHEMA_VERSION) return null;
  let discarded = 0;
  const keep = <T>(items: unknown, guard: (item: unknown) => item is T): T[] => {
    if (!Array.isArray(items)) {
      if (items !== undefined) discarded++;
      return [];
    }
    const valid = items.filter(guard);
    discarded += items.length - valid.length;
    return valid;
  };

  const games: Record<string, Partial<Record<number, LevelRecord>>> = {};
  const rawGames = value['games'];
  if (isObject(rawGames)) {
    for (const [gameId, game] of Object.entries(rawGames)) {
      if (!isObject(game)) {
        discarded++;
        continue;
      }
      const levels = Object.entries(game).filter(([level, record]) => {
        const valid = isDifficultyLevel(Number(level)) && isLevelRecord(record);
        if (!valid) discarded++;
        return valid;
      });
      if (levels.length > 0)
        games[gameId] = Object.fromEntries(levels) as Record<number, LevelRecord>;
    }
  } else if (rawGames !== undefined) discarded++;

  const assessments =
    value['assessments'] === undefined
      ? undefined
      : keep(value['assessments'], isAssessmentSummary);
  const progress: UserProgress = {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    games,
    recentSessions: keep(value['recentSessions'], isSessionSummary),
    ...(assessments === undefined ? {} : { assessments }),
  };
  return { progress, discarded };
}
