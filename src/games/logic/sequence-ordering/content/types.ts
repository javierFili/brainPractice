import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** Positions are 1-based. */
export type OrderClue =
  | { readonly type: 'before'; readonly a: string; readonly b: string }
  | { readonly type: 'right-before'; readonly a: string; readonly b: string }
  | { readonly type: 'at'; readonly a: string; readonly position: number }
  | { readonly type: 'not-at'; readonly a: string; readonly position: number }
  | { readonly type: 'gap'; readonly a: string; readonly b: string; readonly between: number }
  | { readonly type: 'next-to'; readonly a: string; readonly b: string }
  | { readonly type: 'not-next-to'; readonly a: string; readonly b: string };

export type OrderClueType = OrderClue['type'];

export interface OrderingContent {
  readonly kind: 'race' | 'queue';
  readonly entities: readonly string[];
  readonly clues: readonly OrderClue[];
  readonly solution: readonly string[];
}

export type OrderingChallenge = Challenge<'logic', OrderingContent>;

export interface OrderingProfile extends DifficultyProfile {
  readonly entities: number;
  readonly clueTypes: Readonly<Partial<Record<OrderClueType, number>>>;
}
