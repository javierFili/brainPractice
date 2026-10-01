import { isDifficultyLevel, type DifficultyLevel } from '../shared/difficultyLevel';
import { parseSeed, type Seed } from '../random/seed';
import {
  isJsonObject,
  keepValidEntries,
  migrate,
  type Migration,
  type Recovered,
} from '../storage/migrations';
import type { Repository } from '../storage/repository';

export const PROFILE_SCHEMA_VERSION = 1;

/** Calendar day in the learner's own time zone, `YYYY-MM-DD` (computed by the UI). */
export type DayKey = string;
export const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export type Goal = 'learn' | 'train' | 'both';
export const GOALS: readonly Goal[] = ['learn', 'train', 'both'];

export interface DailyRecord {
  readonly gameId: string;
  readonly level: DifficultyLevel;
  readonly seed: Seed;
  readonly performanceIndex: number;
  readonly completedAt: number;
}

export interface UserProfile {
  readonly schemaVersion: typeof PROFILE_SCHEMA_VERSION;
  /** Null until the learner finishes (or skips) onboarding. */
  readonly onboardedAt: number | null;
  readonly goal: Goal | null;
  /** Days per week the learner wants to practise (their own choice, 1–7). */
  readonly weeklyTarget: number;
  /** Days with any activity, oldest first (at most a year is kept). */
  readonly activeDays: readonly DayKey[];
  readonly daily: Readonly<Record<DayKey, DailyRecord>>;
}

export type ProfileRepository = Repository<UserProfile>;

export const DEFAULT_WEEKLY_TARGET = 4;
const MAX_DAYS = 366;

export const emptyProfile = (): UserProfile => ({
  schemaVersion: PROFILE_SCHEMA_VERSION,
  onboardedAt: null,
  goal: null,
  weeklyTarget: DEFAULT_WEEKLY_TARGET,
  activeDays: [],
  daily: {},
});

export function completeOnboarding(
  profile: UserProfile,
  { goal, weeklyTarget, at }: { goal: Goal; weeklyTarget: number; at: number },
): UserProfile {
  return {
    ...profile,
    goal,
    weeklyTarget: Math.min(7, Math.max(1, Math.round(weeklyTarget))),
    onboardedAt: profile.onboardedAt ?? at,
  };
}

export function recordActivity(profile: UserProfile, day: DayKey): UserProfile {
  if (profile.activeDays.includes(day)) return profile;
  const activeDays = [...profile.activeDays, day].sort().slice(-MAX_DAYS);
  return { ...profile, activeDays };
}

export function recordDaily(profile: UserProfile, day: DayKey, record: DailyRecord): UserProfile {
  if (profile.daily[day]) return recordActivity(profile, day);
  return recordActivity({ ...profile, daily: { ...profile.daily, [day]: record } }, day);
}

/** The seven calendar days ending today, oldest first. */
export function lastSevenDays(today: DayKey): DayKey[] {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.UTC(y, m - 1, d - 6 + i));
    return date.toISOString().slice(0, 10);
  });
}

export interface WeekSummary {
  readonly days: readonly { readonly day: DayKey; readonly active: boolean }[];
  readonly activeCount: number;
  readonly target: number;
  readonly reached: boolean;
  /** Consecutive active days ending today or yesterday (today not done yet does not break it). */
  readonly streak: number;
}

export function weekSummary(profile: UserProfile, today: DayKey): WeekSummary {
  const active = new Set(profile.activeDays);
  const days = lastSevenDays(today).map((day) => ({ day, active: active.has(day) }));
  const activeCount = days.filter((d) => d.active).length;
  let streak = 0;
  const cursor = [...profile.activeDays].reverse();
  let expected = active.has(today) ? today : previousDay(today);
  for (const day of cursor) {
    if (day > expected) continue;
    if (day !== expected) break;
    streak++;
    expected = previousDay(expected);
  }
  return {
    days,
    activeCount,
    target: profile.weeklyTarget,
    reached: activeCount >= profile.weeklyTarget,
    streak,
  };
}

export function previousDay(day: DayKey): DayKey {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

// ── Persistence guards ──────────────────────────────────────────────────────────────────────────

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const isDaily = (day: string, value: unknown): value is DailyRecord =>
  DAY_KEY.test(day) &&
  isJsonObject(value) &&
  typeof value['gameId'] === 'string' &&
  isDifficultyLevel(value['level']) &&
  parseSeed(value['seed']).ok &&
  finite(value['performanceIndex']) &&
  finite(value['completedAt']);

export const PROFILE_MIGRATIONS: Readonly<Partial<Record<number, Migration>>> = {};

export function recoverProfile(value: unknown): Recovered<UserProfile> | null {
  const migrated = migrate(value, PROFILE_SCHEMA_VERSION, PROFILE_MIGRATIONS);
  if (!migrated.ok) return null;
  const doc = migrated.value;
  const tally = { discarded: 0 };
  const take = <T>(valid: boolean, value: T, fallback: T): T => {
    if (!valid) tally.discarded++;
    return valid ? value : fallback;
  };
  const days = Array.isArray(doc['activeDays']) ? doc['activeDays'] : [];
  const activeDays = days.filter((d): d is string => typeof d === 'string' && DAY_KEY.test(d));
  tally.discarded += days.length - activeDays.length;
  const target = doc['weeklyTarget'];
  return {
    value: {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      onboardedAt: take(
        doc['onboardedAt'] === null || finite(doc['onboardedAt']),
        doc['onboardedAt'] as number | null,
        null,
      ),
      goal: take(
        doc['goal'] === null || GOALS.includes(doc['goal'] as Goal),
        doc['goal'] as Goal | null,
        null,
      ),
      weeklyTarget: take(
        finite(target) && target >= 1 && target <= 7,
        target as number,
        DEFAULT_WEEKLY_TARGET,
      ),
      activeDays: [...new Set(activeDays)].sort(),
      daily: keepValidEntries(doc['daily'], isDaily, tally),
    },
    discarded: tally.discarded,
  };
}
