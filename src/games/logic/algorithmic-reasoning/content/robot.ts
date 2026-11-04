import { msg, type Message, type Text } from '@/domain/shared';
import { cellLabelAt } from '@/games/kit/content';
import type { Facing, Instruction, RobotContent, RobotState } from './types';

const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];
const FACING = ['up', 'right', 'down', 'left'] as const;
const key = (path: string) => `logic:algorithmicReasoning.${path}`;

/** "up", "right"…: the direction the robot faces. */
export const facingLabel = (facing: Facing): Message => msg(key(`facing.${FACING[facing]}`));

/** "row 2, column 3". */
export const cellLabel = (cell: number, size: number): Message => cellLabelAt(cell, size);

/** The cell in front, or null when it is a wall or off the grid. */
export function ahead(state: RobotState, size: number, walls: ReadonlySet<number>): number | null {
  const r = Math.floor(state.cell / size) + (DR[state.facing] as number);
  const c = (state.cell % size) + (DC[state.facing] as number);
  if (r < 0 || r >= size || c < 0 || c >= size) return null;
  const cell = r * size + c;
  return walls.has(cell) ? null : cell;
}

export interface TraceStep {
  readonly text: Text;
  /** Squares moved by a "move until blocked" step. */
  readonly moved?: number;
  readonly state: RobotState;
}

/**
 * Runs the program. Returns the trace, or null when the robot would walk into a wall or off the
 * grid on a plain "move forward" (such programs are rejected, never shown).
 */
export function run(
  content: Pick<RobotContent, 'size' | 'walls' | 'start' | 'program'>,
): TraceStep[] | null {
  const walls = new Set(content.walls);
  const { size } = content;
  let state = content.start;
  const trace: TraceStep[] = [];
  let budget = 400;
  const exec = (list: readonly Instruction[]): boolean => {
    for (const ins of list) {
      if (--budget < 0) return false;
      switch (ins.type) {
        case 'forward':
          for (let i = 0; i < ins.steps; i++) {
            const next = ahead(state, size, walls);
            if (next === null) return false;
            state = { ...state, cell: next };
          }
          trace.push({
            text: msg(key('trace.move'), { n: ins.steps, cell: cellLabel(state.cell, size) }),
            state,
          });
          break;
        case 'turn': {
          const delta = ins.turn === 'right' ? 1 : ins.turn === 'left' ? 3 : 2;
          state = { ...state, facing: ((state.facing + delta) % 4) as Facing };
          trace.push({
            text: msg(key(`trace.turn.${ins.turn}`), { facing: facingLabel(state.facing) }),
            state,
          });
          break;
        }
        case 'repeat':
          for (let i = 0; i < ins.times; i++) if (!exec(ins.body)) return false;
          break;
        case 'if-blocked': {
          const blocked = ahead(state, size, walls) === null;
          trace.push({ text: msg(key(`trace.${blocked ? 'blocked' : 'clear'}`)), state });
          if (!exec(blocked ? ins.then : ins.otherwise)) return false;
          break;
        }
        case 'until-blocked': {
          let moved = 0;
          for (
            let next = ahead(state, size, walls);
            next !== null;
            next = ahead(state, size, walls)
          ) {
            state = { ...state, cell: next };
            moved++;
          }
          trace.push({
            text: msg(key('trace.untilBlocked'), {
              count: moved,
              cell: cellLabel(state.cell, size),
            }),
            moved,
            state,
          });
          break;
        }
      }
    }
    return true;
  };
  return exec(content.program) ? trace : null;
}

const line = (path: string, depth: number, values?: Record<string, number>) => ({
  text: msg(key(`program.${path}`), values),
  depth,
});

/** Plain-language lines with indentation depth, for display. */
export function describeProgram(
  program: readonly Instruction[],
  depth = 0,
): { text: Message; depth: number }[] {
  return program.flatMap((ins) => {
    switch (ins.type) {
      case 'forward':
        return [line('forward', depth, { count: ins.steps })];
      case 'turn':
        return [line(`turn.${ins.turn}`, depth)];
      case 'repeat':
        return [
          line('repeat', depth, { count: ins.times }),
          ...describeProgram(ins.body, depth + 1),
        ];
      case 'if-blocked':
        return [
          line('ifBlocked', depth),
          ...describeProgram(ins.then, depth + 1),
          line('otherwise', depth),
          ...describeProgram(ins.otherwise, depth + 1),
        ];
      case 'until-blocked':
        return [line('untilBlocked', depth)];
    }
  });
}
