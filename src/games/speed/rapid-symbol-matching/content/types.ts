import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/**
 * `same-different`: two strings side by side — identical or not?
 * `find-match`: a reference string and several candidates — which candidate is identical?
 */
export type MatchKind = 'same-different' | 'find-match';

/**
 * Symbol sets, easiest first. `letters`: capitals with distinct outlines. `shapes`: geometric
 * symbols. `confusable`: groups of look-alikes (b d p q, O Q C G, E F, M N …); changes swap a
 * symbol for one of its own group.
 */
export type SymbolPool = 'letters' | 'shapes' | 'confusable';

export const POOL_ORDER: readonly SymbolPool[] = ['letters', 'shapes', 'confusable'];

/** How a copy is altered: one symbol replaced, or two neighbours swapped. */
export type Mutation = 'substitute' | 'transpose';

export interface SymbolMatchContent {
  readonly kind: MatchKind;
  readonly pool: SymbolPool;
  /** Left string (same-different) or the reference (find-match). */
  readonly reference: string;
  /** Right string for same-different; null for find-match (the candidates are the options). */
  readonly other: string | null;
}

export type SymbolMatchChallenge = Challenge<'speed', SymbolMatchContent>;

export interface SymbolMatchProfile extends DifficultyProfile {
  readonly kinds: Readonly<Partial<Record<MatchKind, number>>>;
  readonly pool: SymbolPool;
  /** Symbols per string. */
  readonly length: number;
  /** Candidates in find-match (2–4). */
  readonly optionCount: number;
  /** Symbols changed in a different copy (2 = easier to spot, 1 = subtle). */
  readonly changes: number;
  readonly mutations: readonly Mutation[];
}
