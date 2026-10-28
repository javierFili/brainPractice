import type { Facing, Instruction, RobotContent, RobotState } from './types';

const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];
export const FACING_WORDS = ['up', 'right', 'down', 'left'] as const;

export const cellLabel = (cell: number, size: number) =>
  `row ${Math.floor(cell / size) + 1}, column ${(cell % size) + 1}`;

/** The cell in front, or null when it is a wall or off the grid. */
export function ahead(state: RobotState, size: number, walls: ReadonlySet<number>): number | null {
  const r = Math.floor(state.cell / size) + (DR[state.facing] as number);
  const c = (state.cell % size) + (DC[state.facing] as number);
  if (r < 0 || r >= size || c < 0 || c >= size) return null;
  const cell = r * size + c;
  return walls.has(cell) ? null : cell;
}

export interface TraceStep {
  readonly text: string;
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
          trace.push({ text: `move ${ins.steps} to ${cellLabel(state.cell, size)}`, state });
          break;
        case 'turn': {
          const delta = ins.turn === 'right' ? 1 : ins.turn === 'left' ? 3 : 2;
          state = { ...state, facing: ((state.facing + delta) % 4) as Facing };
          trace.push({ text: `turn ${ins.turn}, now facing ${FACING_WORDS[state.facing]}`, state });
          break;
        }
        case 'repeat':
          for (let i = 0; i < ins.times; i++) if (!exec(ins.body)) return false;
          break;
        case 'if-blocked': {
          const blocked = ahead(state, size, walls) === null;
          trace.push({ text: blocked ? 'the way is blocked' : 'the way is clear', state });
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
            text: `move until blocked (${moved} squares) to ${cellLabel(state.cell, size)}`,
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

const plural = (n: number) => (n === 1 ? 'square' : 'squares');

/** Plain-language lines with indentation depth, for display. */
export function describeProgram(
  program: readonly Instruction[],
  depth = 0,
): { text: string; depth: number }[] {
  return program.flatMap((ins) => {
    switch (ins.type) {
      case 'forward':
        return [{ text: `Move forward ${ins.steps} ${plural(ins.steps)}.`, depth }];
      case 'turn':
        return [{ text: ins.turn === 'around' ? 'Turn around.' : `Turn ${ins.turn}.`, depth }];
      case 'repeat':
        return [
          { text: `Do this ${ins.times} times:`, depth },
          ...describeProgram(ins.body, depth + 1),
        ];
      case 'if-blocked':
        return [
          { text: 'If the square in front is a wall or the edge:', depth },
          ...describeProgram(ins.then, depth + 1),
          { text: 'Otherwise:', depth },
          ...describeProgram(ins.otherwise, depth + 1),
        ];
      case 'until-blocked':
        return [
          { text: 'Keep moving forward until the square in front is a wall or the edge.', depth },
        ];
    }
  });
}
