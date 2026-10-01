import { isLevelCleared, suggestedLevel, type UserProgress } from '../progress/progress';
import { COGNITIVE_AREAS, type CognitiveArea } from '../shared/cognitiveArea';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '../shared/difficultyLevel';

export interface AreaStanding {
  readonly area: CognitiveArea;
  readonly gameId: string | null;
  /** Highest level cleared (performance ≥ 70); 0 when none yet. */
  readonly clearedLevel: number;
  readonly suggestedLevel: DifficultyLevel;
  /** Mean performance index of the last few completed, timed sessions; null without evidence. */
  readonly recentPerformance: number | null;
  readonly sessions: number;
}

const RECENT = 5;

/**
 * "Your mind" as observed on these exercises: levels reached and recent performance per area.
 * A description of practice, not a measurement of ability.
 */
export function cognitiveProfile(
  progress: UserProgress,
  gameOfArea: Readonly<Partial<Record<CognitiveArea, string>>>,
): AreaStanding[] {
  return COGNITIVE_AREAS.map((area) => {
    const gameId = gameOfArea[area] ?? null;
    const game = gameId === null ? undefined : progress.games[gameId];
    const cleared = DIFFICULTY_LEVELS.filter((level) => isLevelCleared(game?.[level]));
    const recent = progress.recentSessions
      .filter((s) => s.gameId === gameId && s.completed && !s.assisted)
      .slice(0, RECENT);
    return {
      area,
      gameId,
      clearedLevel: cleared.at(-1) ?? 0,
      suggestedLevel: suggestedLevel(game),
      recentPerformance:
        recent.length === 0
          ? null
          : Math.round(recent.reduce((sum, s) => sum + s.performanceIndex, 0) / recent.length),
      sessions: progress.recentSessions.filter((s) => s.gameId === gameId).length,
    };
  });
}
