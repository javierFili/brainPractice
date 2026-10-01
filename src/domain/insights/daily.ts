import { suggestedLevel, type UserProgress } from '../progress/progress';
import { toSeed, type Seed } from '../random/seed';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import type { DayKey } from '../profile/profile';

/** A short session: a daily habit should take minutes, not half an hour. */
export const DAILY_CHALLENGE_COUNT = 5;

export interface DailyChallenge {
  readonly day: DayKey;
  readonly gameId: string;
  readonly level: DifficultyLevel;
  readonly seed: Seed;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const dayNumber = (day: DayKey) => {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
};

/**
 * Today's challenge: the game rotates daily through every area, the challenges (seed) are the same
 * for everyone that day, and the level is the learner's own suggested level for that game.
 */
export function dailyChallenge(
  day: DayKey,
  gameIds: readonly string[],
  games: UserProgress['games'],
): DailyChallenge {
  if (gameIds.length === 0) throw new RangeError('No games to pick a daily challenge from');
  const gameId = gameIds[dayNumber(day) % gameIds.length] as string;
  return { day, gameId, level: suggestedLevel(games[gameId]), seed: toSeed(hash(`daily:${day}`)) };
}
