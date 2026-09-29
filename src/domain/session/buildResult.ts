import type { DifficultyStrategy } from '../difficulty/DifficultyStrategy';
import type { ScoringStrategy } from '../scoring/scoring';
import type { GameResult } from './gameResult';
import { computeMetrics } from './performanceMetrics';
import type { SessionState } from './sessionState';

export function buildResult(
  state: SessionState,
  scoring: ScoringStrategy,
  difficulty: DifficultyStrategy,
): GameResult {
  if (state.status !== 'finished' || state.endedAt === null) {
    throw new Error('Cannot build the result of an unfinished session');
  }
  const { gameId, level, seed, assisted } = state.settings;
  const metrics = computeMetrics(state.records);
  return {
    gameId,
    level,
    seed,
    assisted,
    completed: metrics.skipped === 0,
    startedAt: state.startedAt,
    endedAt: state.endedAt,
    durationMs: state.endedAt - state.startedAt,
    records: state.records,
    metrics,
    score: scoring.scoreSession(state.records, level),
    recommendation: difficulty.determineNextLevel({ currentLevel: level, performance: metrics }),
  };
}
