import type { Audience, GameCategory } from '../game/catalog';
import {
  isLevelCleared,
  suggestedLevel,
  unlockedLevels,
  type SessionSummary,
  type UserProgress,
} from '../progress/progress';
import { mulberry32 } from '../random/mulberry32';
import type { Seed } from '../random/seed';
import { shuffle } from '../random/sampling';
import { stepLevel, type DifficultyLevel } from '../shared/difficultyLevel';
import { msg, type Text } from '../shared/text';

/** What the insights need to know about a game (a projection of its definition). */
export interface CatalogEntry {
  readonly id: string;
  readonly name: Text;
  readonly category: GameCategory;
  readonly audiences: readonly Audience[];
  readonly estimatedMinutes: number;
  readonly relaxedFriendly: boolean;
}

const DAY_MS = 86_400_000;

// ── Continue ───────────────────────────────────────────────────────────────────────────────────

export interface ContinueTarget {
  readonly session: SessionSummary;
  readonly gameId: string;
  /** The level to play next: the same one until it is cleared, then the next open one. */
  readonly level: DifficultyLevel;
  readonly cleared: boolean;
}

export function continueTarget(
  progress: UserProgress,
  exists: (gameId: string) => boolean,
  freePlay = false,
): ContinueTarget | null {
  const session = progress.recentSessions.find((s) => exists(s.gameId));
  if (!session) return null;
  const game = progress.games[session.gameId];
  const cleared = isLevelCleared(game?.[session.level]);
  const open = unlockedLevels(game, freePlay);
  const next = cleared ? stepLevel(session.level, 1) : session.level;
  return {
    session,
    gameId: session.gameId,
    level: open.includes(next) ? next : session.level,
    cleared,
  };
}

// ── Recommendations ───────────────────────────────────────────────────────────────────────────

export type TrainingSuggestionKind = 'level-up' | 'variety' | 'discover' | 'start';

export interface TrainingSuggestion {
  readonly kind: TrainingSuggestionKind;
  readonly gameId: string;
  readonly level: DifficultyLevel;
  /** Always explains itself in terms of the person's own activity, never a diagnosis. */
  readonly reason: Text;
}

export interface TrainingInput {
  readonly catalog: readonly CatalogEntry[];
  readonly progress: UserProgress;
  /** Games of the chosen route, best first; empty without a route. */
  readonly featured: readonly string[];
  /** Categories that belong in variety suggestions (programming only when relevant). */
  readonly categories: readonly GameCategory[];
  readonly now: number;
  readonly freePlay?: boolean;
}

/**
 * One sentence per category (not a category name inserted into a sentence): articles and cases
 * change with the category in Spanish, French, Italian and German.
 */
const categoryReason = (sentence: string, category: GameCategory): Text =>
  msg(`progress:training.${sentence}.${category}`);

/**
 * Up to three suggestions, each for a different game: a level that just opened, a category not
 * practised lately, and a game not tried yet. Deterministic and explained.
 */
export function recommendTraining(input: TrainingInput): TrainingSuggestion[] {
  const { catalog, progress, featured, categories, now, freePlay = false } = input;
  const byId = new Map(catalog.map((g) => [g.id, g]));
  const played = new Set(progress.recentSessions.map((s) => s.gameId));
  for (const id of Object.keys(progress.games)) played.add(id);
  const order = [...featured.filter((id) => byId.has(id)), ...catalog.map((g) => g.id)];
  const ranked = [...new Set(order)].map((id) => byId.get(id) as CatalogEntry);
  const suggestions: TrainingSuggestion[] = [];
  const taken = new Set<string>();
  const add = (s: TrainingSuggestion) => {
    if (taken.has(s.gameId) || suggestions.length >= 3) return;
    taken.add(s.gameId);
    suggestions.push(s);
  };

  if (progress.recentSessions.length === 0) {
    for (const game of ranked.filter((g) => categories.includes(g.category)).slice(0, 3)) {
      add({
        kind: 'start',
        gameId: game.id,
        level: 1,
        reason: featured.includes(game.id)
          ? msg('progress:training.startRoute')
          : categoryReason('gentleStart', game.category),
      });
    }
    return suggestions;
  }

  // A level that opened because of a recent session and has not been tried yet.
  for (const session of progress.recentSessions) {
    const game = progress.games[session.gameId];
    if (!byId.has(session.gameId) || !isLevelCleared(game?.[session.level])) continue;
    const next = stepLevel(session.level, 1);
    if (next === session.level || game?.[next] !== undefined) continue;
    if (!unlockedLevels(game, freePlay).includes(next)) continue;
    add({
      kind: 'level-up',
      gameId: session.gameId,
      level: next,
      reason: msg('progress:training.levelUp', { cleared: session.level, next }),
    });
    break;
  }

  // The category practised least over the last two weeks.
  const recent = progress.recentSessions.filter((s) => now - s.endedAt <= 14 * DAY_MS);
  const counts = new Map<GameCategory, number>(categories.map((c) => [c, 0]));
  for (const s of recent) {
    const category = byId.get(s.gameId)?.category;
    if (category !== undefined && counts.has(category))
      counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  const quiet = [...counts.entries()].sort((a, b) => a[1] - b[1])[0];
  if (quiet) {
    const [category, count] = quiet;
    const game =
      ranked.find((g) => g.category === category && !played.has(g.id) && !taken.has(g.id)) ??
      ranked.find((g) => g.category === category && !taken.has(g.id));
    if (game) {
      add({
        kind: 'variety',
        gameId: game.id,
        level: suggestedLevel(progress.games[game.id]),
        reason:
          count === 0
            ? categoryReason('notPractised', category)
            : categoryReason('leastPractised', category),
      });
    }
  }

  // Something new, from the route first.
  const fresh = ranked.find(
    (g) => !played.has(g.id) && !taken.has(g.id) && categories.includes(g.category),
  );
  if (fresh) {
    add({
      kind: 'discover',
      gameId: fresh.id,
      level: 1,
      reason: featured.includes(fresh.id)
        ? msg('progress:training.discoverRoute')
        : msg('progress:training.discover'),
    });
  }
  return suggestions;
}

// ── Quick sessions ────────────────────────────────────────────────────────────────────────────

export interface QuickStep {
  readonly index: number;
  readonly gameId: string;
  readonly level: DifficultyLevel;
  readonly challengeCount: number;
}

export interface QuickPlanInput {
  readonly minutes: number;
  readonly catalog: readonly CatalogEntry[];
  readonly progress: UserProgress;
  readonly featured: readonly string[];
  readonly categories: readonly GameCategory[];
  readonly seed: Seed;
  /** Challenge count of a game at a level (its regular session length). */
  readonly challengeCountOf: (gameId: string, level: DifficultyLevel) => number;
  /** Only games that stay meaningful without time limits. */
  readonly relaxedOnly?: boolean;
}

/** Roughly 2.5 minutes per activity; the real duration depends on the games and on the player. */
export const MINUTES_PER_BLOCK = 2.5;

/**
 * A mixed session of short blocks from different categories, at each game's suggested level.
 * Blocks are shortened versions of the regular sessions (at least 2 challenges).
 */
export function planQuickSession(input: QuickPlanInput): QuickStep[] {
  const { minutes, catalog, progress, featured, categories, seed, challengeCountOf } = input;
  if (!(minutes > 0)) throw new RangeError('minutes must be positive');
  const random = mulberry32(seed);
  const pool = catalog.filter(
    (g) => categories.includes(g.category) && (!input.relaxedOnly || g.relaxedFriendly),
  );
  if (pool.length === 0) throw new RangeError('No games available for a quick session');
  const blocks = Math.max(1, Math.round(minutes / MINUTES_PER_BLOCK));
  const blockMinutes = minutes / blocks;
  const featuredSet = new Set(featured);
  // Route games first, then the rest, each group shuffled; then round-robin over categories.
  const ordered = [
    ...shuffle(
      random,
      pool.filter((g) => featuredSet.has(g.id)),
    ),
    ...shuffle(
      random,
      pool.filter((g) => !featuredSet.has(g.id)),
    ),
  ];
  const cats = shuffle(random, [...new Set(ordered.map((g) => g.category))]);
  const picked: CatalogEntry[] = [];
  for (let round = 0; picked.length < blocks && round < ordered.length; round++) {
    for (const category of cats) {
      const game = ordered.find((g) => g.category === category && !picked.includes(g));
      if (game && picked.length < blocks) picked.push(game);
    }
  }
  return picked.map((game, index) => {
    const level = suggestedLevel(progress.games[game.id]);
    const regular = challengeCountOf(game.id, level);
    const scaled = Math.round((regular * blockMinutes) / Math.max(1, game.estimatedMinutes));
    return {
      index,
      gameId: game.id,
      level,
      challengeCount: Math.max(2, Math.min(regular, scaled)),
    };
  });
}

// ── Comparable sessions ───────────────────────────────────────────────────────────────────────

export interface Comparison {
  readonly previous: SessionSummary;
  readonly accuracyDelta: number;
  readonly performanceDelta: number;
}

/**
 * Compares a session only with the previous completed session of the same game, level and timing
 * mode — the only comparison that measures the same exercise. `sessions` is most recent first
 * and may already contain `current`.
 */
export function compareWith(
  sessions: readonly SessionSummary[],
  current: SessionSummary,
): Comparison | null {
  if (!current.completed) return null;
  const previous = sessions.find(
    (s) =>
      s !== current &&
      s.gameId === current.gameId &&
      s.level === current.level &&
      s.assisted === current.assisted &&
      s.completed &&
      s.endedAt < current.endedAt,
  );
  if (!previous) return null;
  return {
    previous,
    accuracyDelta: current.accuracy - previous.accuracy,
    performanceDelta: current.performanceIndex - previous.performanceIndex,
  };
}

/** Performance index per completed session of one game and level, oldest first (for trends). */
export function levelTrend(
  sessions: readonly SessionSummary[],
  gameId: string,
  level: DifficultyLevel,
): number[] {
  return sessions
    .filter((s) => s.gameId === gameId && s.level === level && s.completed && !s.assisted)
    .map((s) => s.performanceIndex)
    .reverse();
}
