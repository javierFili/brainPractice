import { err, ok, type Result } from './result';

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const MIN_LEVEL: DifficultyLevel = 1;
export const MAX_LEVEL: DifficultyLevel = 10;

/** Levels 1–3 fundamentals, 4–6 intermediate, 7–8 advanced, 9–10 expert. */
export type DifficultyTier = 'fundamentals' | 'intermediate' | 'advanced' | 'expert';

export const isDifficultyLevel = (value: unknown): value is DifficultyLevel =>
  typeof value === 'number' && (DIFFICULTY_LEVELS as readonly number[]).includes(value);

export interface InvalidLevelError {
  readonly code: 'INVALID_LEVEL';
  readonly input: unknown;
}

/** Parses untrusted input (URL params, storage). Accepts numbers and canonical integer strings. */
export function parseDifficultyLevel(input: unknown): Result<DifficultyLevel, InvalidLevelError> {
  const value = typeof input === 'string' && /^\d{1,2}$/.test(input) ? Number(input) : input;
  return isDifficultyLevel(value) ? ok(value) : err({ code: 'INVALID_LEVEL', input });
}

export function tierOf(level: DifficultyLevel): DifficultyTier {
  if (level <= 3) return 'fundamentals';
  if (level <= 6) return 'intermediate';
  if (level <= 8) return 'advanced';
  return 'expert';
}

/** Moves `delta` levels, clamped to [1, 10]. */
export function stepLevel(level: DifficultyLevel, delta: number): DifficultyLevel {
  if (!Number.isInteger(delta)) throw new RangeError(`delta must be an integer, got ${delta}`);
  const target = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level + delta));
  // Safe: target is an integer clamped to the level range.
  return target as DifficultyLevel;
}
