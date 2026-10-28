import type { DifficultyProfile, LevelTable } from '@/domain/difficulty';
import { DIFFICULTY_LEVELS, tierOf, type DifficultyLevel } from '@/domain/shared';

/** One row per level, without the fields derived from the position (`level`, `tier`). */
export type LevelRow<P extends DifficultyProfile> = Omit<P, 'level' | 'tier'>;

/**
 * Builds a level table from exactly ten rows (level 1 first). Keeps tables short and makes the
 * level/tier bookkeeping impossible to get wrong; the registry still validates the result.
 */
export function defineLevels<P extends DifficultyProfile>(
  rows: readonly LevelRow<P>[],
): LevelTable<P> {
  if (rows.length !== DIFFICULTY_LEVELS.length) {
    throw new RangeError(`A level table needs exactly 10 rows, got ${rows.length}`);
  }
  return Object.fromEntries(
    DIFFICULTY_LEVELS.map((level: DifficultyLevel, i) => [
      level,
      { ...rows[i], level, tier: tierOf(level) },
    ]),
  ) as LevelTable<P>;
}

/** Untimed timing for tasks where speed is not the point (no limit, generous target). */
export const untimed = (targetMs: number, studyMs: number | null = null) => ({
  studyMs,
  limitMs: null,
  targetMs,
});

export const timed = (targetMs: number, limitMs: number, studyMs: number | null = null) => ({
  studyMs,
  limitMs,
  targetMs,
});
