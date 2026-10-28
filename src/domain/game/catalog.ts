/**
 * Catalog sections. A category groups games by what the player does; it is independent of the
 * assessment `area` a game reports to (a programming game may report to `logic`).
 */
export const GAME_CATEGORIES = [
  'memory',
  'logic',
  'speed',
  'attention',
  'patterns',
  'programming',
] as const;

export type GameCategory = (typeof GAME_CATEGORIES)[number];

export const isGameCategory = (value: unknown): value is GameCategory =>
  typeof value === 'string' && (GAME_CATEGORIES as readonly string[]).includes(value);

/** Who a game is designed to suit. Audiences recommend, they never restrict access. */
export const AUDIENCES = ['kids', 'teens', 'adults', 'seniors', 'programmers'] as const;

export type Audience = (typeof AUDIENCES)[number];

export const isAudience = (value: unknown): value is Audience =>
  typeof value === 'string' && (AUDIENCES as readonly string[]).includes(value);

/** How the player mainly answers; drives the "how you play" copy and accessibility notes. */
export type InteractionMode =
  'choice' | 'grid' | 'sequence' | 'tap' | 'pairs' | 'ordering' | 'numeric' | 'mixed';

/**
 * The figures a game's results are meaningful for. Speed figures are shown only where the task is
 * about speed; untimed tasks keep accuracy as their result.
 */
export type MeasuredMetric =
  'accuracy' | 'response-time' | 'reaction-time' | 'completion-time' | 'streak';

/** How the player is told about each answer. */
export type FeedbackStyle =
  /** A full explanation that the player dismisses (reasoning tasks). */
  | 'explain'
  /** A short correct/incorrect mark that advances by itself (fast-paced tasks). */
  | 'brief';

export interface GameMeta {
  readonly category: GameCategory;
  readonly audiences: readonly Audience[];
  readonly interaction: InteractionMode;
  /** Typical minutes for one session at a mid level. */
  readonly estimatedMinutes: number;
  /** `full`: playable without a pointer; `partial`: some steps need a pointer. */
  readonly keyboard: 'full' | 'partial';
  /** True when relaxed timing keeps the task meaningful (no hard dependency on speed). */
  readonly relaxedFriendly: boolean;
  readonly measures: readonly MeasuredMetric[];
  /** Plain-language description of how the result is computed. */
  readonly scoringSummary: string;
  readonly feedback: FeedbackStyle;
  /** Known limitations for assistive technologies; shown on the game page. */
  readonly accessibilityNotes?: string;
}

export function validateGameMeta(meta: GameMeta): string[] {
  const issues: string[] = [];
  if (!isGameCategory(meta.category)) issues.push(`unknown category "${String(meta.category)}"`);
  if (meta.audiences.length === 0) issues.push('audiences are empty');
  if (meta.measures.length === 0) issues.push('measures are empty');
  if (!(meta.estimatedMinutes > 0 && meta.estimatedMinutes <= 30))
    issues.push('estimatedMinutes must be in (0, 30]');
  if (meta.scoringSummary.trim() === '') issues.push('scoringSummary is empty');
  return issues;
}
