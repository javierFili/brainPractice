import { isAudience, type Audience } from '../game/catalog';
import { isJsonObject, migrate, type Migration, type Recovered } from '../storage/migrations';
import type { Repository } from '../storage/repository';

export const PREFERENCES_SCHEMA_VERSION = 1;

export type TextSize = 'normal' | 'large' | 'x-large';
export const TEXT_SIZES: readonly TextSize[] = ['normal', 'large', 'x-large'];

/** `system` follows the operating system's reduced-motion setting. */
export type MotionPreference = 'system' | 'reduce';

export const QUICK_SESSION_MINUTES = [3, 5, 10, 15] as const;
export type QuickSessionMinutes = (typeof QUICK_SESSION_MINUTES)[number];

/**
 * Choices the person makes about how the app behaves. Nothing here is inferred: a route is only
 * set when chosen, and it never limits which games or levels can be played.
 */
export interface Preferences {
  readonly schemaVersion: typeof PREFERENCES_SCHEMA_VERSION;
  /** Chosen route (kids, seniors, …); null = general experience. */
  readonly path: Audience | null;
  readonly textSize: TextSize;
  readonly motion: MotionPreference;
  /** Larger targets and calmer screens. */
  readonly comfort: boolean;
  /** Start every game in relaxed timing (no answer limits, longer study). */
  readonly relaxedByDefault: boolean;
  /** Every level of every game open, without unlocking. */
  readonly freePlay: boolean;
  readonly sidebarCollapsed: boolean;
  /** Voluntary daily goal in minutes; null = no goal. */
  readonly dailyGoalMinutes: number | null;
}

export type PreferencesRepository = Repository<Preferences>;

export const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30] as const;

export const defaultPreferences = (): Preferences => ({
  schemaVersion: PREFERENCES_SCHEMA_VERSION,
  path: null,
  textSize: 'normal',
  motion: 'system',
  comfort: false,
  relaxedByDefault: false,
  freePlay: false,
  sidebarCollapsed: false,
  dailyGoalMinutes: null,
});

/**
 * Suggested settings when a route is chosen. They are applied once, visibly, and can be changed
 * at any time; choosing a route never changes difficulty by itself.
 */
export function routeDefaults(path: Audience): Partial<Preferences> {
  switch (path) {
    case 'seniors':
      return { textSize: 'large', comfort: true, relaxedByDefault: true };
    case 'kids':
      return { comfort: true, relaxedByDefault: true };
    case 'programmers':
      return { freePlay: true };
    case 'teens':
    case 'adults':
      return {};
  }
}

export const PREFERENCES_MIGRATIONS: Readonly<Partial<Record<number, Migration>>> = {};

/** Keeps every valid field and falls back to the default for the rest. */
export function recoverPreferences(value: unknown): Recovered<Preferences> | null {
  const migrated = migrate(value, PREFERENCES_SCHEMA_VERSION, PREFERENCES_MIGRATIONS);
  if (!migrated.ok) return null;
  const doc = migrated.value;
  const defaults = defaultPreferences();
  let discarded = 0;
  const field = <K extends keyof Preferences>(key: K, valid: (v: unknown) => boolean) => {
    const raw = doc[key];
    if (raw === undefined) return defaults[key];
    if (valid(raw)) return raw as Preferences[K];
    discarded++;
    return defaults[key];
  };
  const bool = (v: unknown) => typeof v === 'boolean';
  const preferences: Preferences = {
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
    path: field('path', (v) => v === null || isAudience(v)),
    textSize: field('textSize', (v) => TEXT_SIZES.includes(v as TextSize)),
    motion: field('motion', (v) => v === 'system' || v === 'reduce'),
    comfort: field('comfort', bool),
    relaxedByDefault: field('relaxedByDefault', bool),
    freePlay: field('freePlay', bool),
    sidebarCollapsed: field('sidebarCollapsed', bool),
    dailyGoalMinutes: field(
      'dailyGoalMinutes',
      (v) => v === null || (typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 120),
    ),
  };
  return { value: preferences, discarded };
}

export const isPreferences = (value: unknown): value is Preferences =>
  isJsonObject(value) && recoverPreferences(value)?.discarded === 0;
