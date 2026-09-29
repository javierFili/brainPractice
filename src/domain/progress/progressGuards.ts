import { isDifficultyLevel } from '../shared/difficultyLevel';
import { parseSeed } from '../random/seed';
import {
  PROGRESS_SCHEMA_VERSION,
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

/** Validates untrusted persisted data (e.g. edited or stale localStorage) before it reaches the domain. */
export function isUserProgress(value: unknown): value is UserProgress {
  if (!isObject(value) || value['schemaVersion'] !== PROGRESS_SCHEMA_VERSION) return false;
  const { games, recentSessions } = value;
  if (!Array.isArray(recentSessions) || !recentSessions.every(isSessionSummary) || !isObject(games))
    return false;
  return Object.values(games).every(
    (game) =>
      isObject(game) &&
      Object.entries(game).every(
        ([level, record]) => isDifficultyLevel(Number(level)) && isLevelRecord(record),
      ),
  );
}
