import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';
import type { Figure } from '../../shared/content';

export type MatrixAttribute = 'shape' | 'color' | 'count' | 'rotation';

/**
 * How one feature is laid out over the matrix. `latin-*`: every value once per row and column
 * (along one diagonal direction or the other). `step-*`: a number that changes by the same amount
 * from cell to cell along each row (or down each column); only for counts and arrow directions.
 */
export type MatrixRule =
  'constant' | 'by-row' | 'by-column' | 'latin-down' | 'latin-up' | 'step-row' | 'step-column';

export interface MatrixContent {
  /**
   * `shapes-colours`: shapes and colours vary. `counts`: the number of shapes varies too.
   * `arrows`: arrows whose direction follows a rule.
   */
  readonly kind: 'shapes-colours' | 'counts' | 'arrows';
  readonly size: 2 | 3;
  /** Row-major; exactly one cell is null (the missing one). */
  readonly cells: readonly (readonly (Figure | null)[])[];
}

export type MatrixChallenge = Challenge<'patterns', MatrixContent>;

export interface MatrixProfile extends DifficultyProfile {
  readonly size: 2 | 3;
  /** Rules each feature may follow at this level; features left out stay constant. */
  readonly rules: Readonly<Partial<Record<MatrixAttribute, readonly MatrixRule[]>>>;
  /** complexity: how many features follow a rule at once. */
  readonly varying: number;
  /** The missing cell may be anywhere (otherwise bottom-right). */
  readonly anywhere: boolean;
  /** Options to choose from (answer included). */
  readonly options: number;
}
