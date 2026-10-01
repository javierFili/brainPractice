import { isCognitiveArea } from '../shared/cognitiveArea';
import { isDifficultyLevel } from '../shared/difficultyLevel';
import { parseSeed } from '../random/seed';
import {
  keepValid,
  keepValidEntries,
  migrate,
  type Migration,
  type Recovered,
} from '../storage/migrations';
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

/** Upgrades from older schema versions; add `n: (v_n) => v_n+1` when the schema changes. */
export const PROGRESS_MIGRATIONS: Readonly<Partial<Record<number, Migration>>> = {};

/**
 * Salvages what can be trusted from persisted data instead of throwing everything away when one
 * entry is malformed. Older versions are migrated first. Returns null only when nothing is
 * recoverable (not an object, unknown or newer schema version).
 */
export function recoverUserProgress(value: unknown): Recovered<UserProgress> | null {
  const migrated = migrate(value, PROGRESS_SCHEMA_VERSION, PROGRESS_MIGRATIONS);
  if (!migrated.ok) return null;
  const document = migrated.value;
  const tally = { discarded: 0 };

  const games: Record<string, Partial<Record<number, LevelRecord>>> = {};
  const rawGames = document['games'];
  if (isObject(rawGames)) {
    for (const [gameId, game] of Object.entries(rawGames)) {
      const levels = keepValidEntries(
        game,
        (level, record): record is LevelRecord =>
          isDifficultyLevel(Number(level)) && isLevelRecord(record),
        tally,
      );
      if (Object.keys(levels).length > 0) games[gameId] = levels;
    }
  } else if (rawGames !== undefined) tally.discarded++;

  const assessments =
    document['assessments'] === undefined
      ? undefined
      : keepValid(document['assessments'], isAssessmentSummary, tally);
  const progress: UserProgress = {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    games,
    recentSessions: keepValid(document['recentSessions'], isSessionSummary, tally),
    ...(assessments === undefined ? {} : { assessments }),
  };
  return { value: progress, discarded: tally.discarded };
}
