import type { GameCategory } from '../game/catalog';
import type { UserProfile } from '../profile/profile';
import { isLevelCleared, type UserProgress } from '../progress/progress';
import { DIFFICULTY_LEVELS } from '../shared/difficultyLevel';
import { msg, type Text } from '../shared/text';

/**
 * Milestones reward real activity only, and are computed from stored data every time (nothing is
 * granted or stored separately, so they can never disagree with the history). None of them is
 * about streaks: missing a day never takes anything away.
 */
export interface Milestone {
  readonly id: string;
  readonly title: Text;
  readonly description: Text;
  readonly achieved: boolean;
  /** Progress towards the milestone, for display. */
  readonly current: number;
  readonly target: number;
}

export interface MilestoneInput {
  readonly progress: UserProgress;
  readonly profile: UserProfile;
  readonly categoryOf: (gameId: string) => GameCategory | undefined;
}

const MINUTE = 60_000;

export function milestones({ progress, profile, categoryOf }: MilestoneInput): Milestone[] {
  const gamesPlayed = new Set([
    ...Object.keys(progress.games),
    ...progress.recentSessions.map((s) => s.gameId),
  ]);
  const categories = new Set(
    [...gamesPlayed].map(categoryOf).filter((c) => c !== undefined && c !== 'programming'),
  );
  const cleared = Object.values(progress.games).flatMap((game) =>
    DIFFICULTY_LEVELS.filter((level) => isLevelCleared(game[level])),
  );
  const highest = cleared.length === 0 ? 0 : Math.max(...cleared);
  const minutes = Math.floor(progress.totals.practiceMs / MINUTE);
  const dailies = Object.keys(profile.daily).length;
  const make = (id: string, current: number, target: number): Milestone => ({
    id,
    title: msg(`progress:milestones.${id}.title`),
    description: msg(`progress:milestones.${id}.description`),
    current: Math.min(current, target),
    target,
    achieved: current >= target,
  });
  return [
    make('first-session', progress.totals.sessions, 1),
    make('ten-sessions', progress.totals.sessions, 10),
    make('fifty-sessions', progress.totals.sessions, 50),
    make('half-hour', minutes, 30),
    make('five-hours', minutes, 300),
    make('explorer', gamesPlayed.size, 5),
    make('collector', gamesPlayed.size, 20),
    make('all-areas', categories.size, 5),
    make('first-clear', cleared.length, 1),
    make('advanced', highest >= 7 ? 1 : 0, 1),
    make('master', highest >= 10 ? 1 : 0, 1),
    make('daily-three', dailies, 3),
    make('assessment', progress.assessments?.length ?? 0, 1),
    make('active-days', profile.activeDays.length, 7),
  ];
}
