import type { GameCategory } from '../game/catalog';
import type { UserProfile } from '../profile/profile';
import { isLevelCleared, type UserProgress } from '../progress/progress';
import { DIFFICULTY_LEVELS } from '../shared/difficultyLevel';

/**
 * Milestones reward real activity only, and are computed from stored data every time (nothing is
 * granted or stored separately, so they can never disagree with the history). None of them is
 * about streaks: missing a day never takes anything away.
 */
export interface Milestone {
  readonly id: string;
  readonly title: string;
  readonly description: string;
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
  const make = (
    id: string,
    title: string,
    description: string,
    current: number,
    target: number,
  ): Milestone => ({
    id,
    title,
    description,
    current: Math.min(current, target),
    target,
    achieved: current >= target,
  });
  return [
    make('first-session', 'First session', 'Complete any activity.', progress.totals.sessions, 1),
    make(
      'ten-sessions',
      'Ten sessions',
      'Practise ten times, at any pace.',
      progress.totals.sessions,
      10,
    ),
    make(
      'fifty-sessions',
      'Fifty sessions',
      'A long-term practice habit.',
      progress.totals.sessions,
      50,
    ),
    make(
      'half-hour',
      '30 minutes of practice',
      'Total practice time across all activities.',
      minutes,
      30,
    ),
    make(
      'five-hours',
      '5 hours of practice',
      'Total practice time across all activities.',
      minutes,
      300,
    ),
    make('explorer', 'Explorer', 'Try five different games.', gamesPlayed.size, 5),
    make('collector', 'Wide explorer', 'Try twenty different games.', gamesPlayed.size, 20),
    make(
      'all-areas',
      'All-rounder',
      'Practise memory, logic, speed, attention and patterns.',
      categories.size,
      5,
    ),
    make(
      'first-clear',
      'First level cleared',
      'Reach a performance of 70 on any level.',
      cleared.length,
      1,
    ),
    make('advanced', 'Advanced', 'Clear level 7 or higher in any game.', highest >= 7 ? 1 : 0, 1),
    make('master', 'Master level', 'Clear level 10 in any game.', highest >= 10 ? 1 : 0, 1),
    make(
      'daily-three',
      'Daily challenger',
      'Complete three daily challenges (any days).',
      dailies,
      3,
    ),
    make(
      'assessment',
      'Self-check',
      'Complete a cognitive assessment.',
      progress.assessments?.length ?? 0,
      1,
    ),
    make(
      'active-days',
      'Seven active days',
      'Practise on seven different days — not necessarily in a row.',
      profile.activeDays.length,
      7,
    ),
  ];
}
