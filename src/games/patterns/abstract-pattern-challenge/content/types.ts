import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Figure } from '../../shared/content';

/** The rule all panels but one follow. */
export type PanelRule =
  | 'same-colour'
  | 'same-shape'
  | 'different-shapes'
  | 'different-colours'
  | 'same-count'
  | 'contains-shape'
  | 'same-direction'
  | 'one-odd-colour'
  | 'mirror-order';

export interface AbstractContent {
  /** Which feature the hidden rule is about. */
  readonly kind: 'colour' | 'shape' | 'count' | 'direction' | 'order';
  /** Each panel is a row of single figures, read left to right. */
  readonly panels: readonly (readonly Figure[])[];
}

export type AbstractChallenge = Challenge<'patterns', AbstractContent>;

export interface AbstractProfile extends DifficultyProfile {
  /** elementCount: panels shown (one breaks the rule). */
  readonly panels: number;
  readonly minFigures: number;
  readonly maxFigures: number;
  /** Rules that may be hidden at this level, with relative weights. */
  readonly rules: Readonly<Partial<Record<PanelRule, number>>>;
}
