import type { Challenge } from '@/domain/challenge';
import type { DifficultyProfile } from '@/domain/difficulty';

/** 0 = up, 1 = right, 2 = down, 3 = left (clockwise). */
export type Facing = 0 | 1 | 2 | 3;

export type Instruction =
  | { readonly type: 'forward'; readonly steps: number }
  | { readonly type: 'turn'; readonly turn: 'left' | 'right' | 'around' }
  | { readonly type: 'repeat'; readonly times: number; readonly body: readonly Instruction[] }
  | {
      readonly type: 'if-blocked';
      readonly then: readonly Instruction[];
      readonly otherwise: readonly Instruction[];
    }
  /** Move forward until the square in front is a wall or the edge. */
  | { readonly type: 'until-blocked' };

export type Block =
  'forward' | 'turn' | 'repeat' | 'if-blocked' | 'until-blocked' | 'nested-repeat';

export interface RobotState {
  readonly cell: number;
  readonly facing: Facing;
}

export interface RobotContent {
  readonly kind: 'straight' | 'loops' | 'conditions';
  readonly size: number;
  readonly walls: readonly number[];
  readonly start: RobotState;
  readonly program: readonly Instruction[];
}

export type RobotChallenge = Challenge<'logic', RobotContent>;

export interface RobotProfile extends DifficultyProfile {
  readonly size: number;
  readonly walls: number;
  /** Top-level instructions. */
  readonly length: number;
  readonly blocks: Readonly<Partial<Record<Block, number>>>;
}
