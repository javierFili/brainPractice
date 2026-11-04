import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf, joinText, msg } from '@/domain/shared';
import type { Draft } from '@/games/logic/shared/content';
import { CONSTRAINT_LEVELS } from './levels';
import { cellName, solveGrid } from './solver';
import type {
  ConstraintChallenge,
  ConstraintContent,
  ConstraintProfile,
  Inequality,
} from './types';

export const CONSTRAINT_SOLVER_ID = gameIdOf('constraint-solver');

function adjacentPairs(size: number): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < size * size; i++) {
    if (i % size < size - 1) pairs.push([i, i + 1]);
    if (i + size < size * size) pairs.push([i, i + size]);
  }
  return pairs;
}

function buildGrid(random: RandomGenerator, profile: ConstraintProfile): ConstraintContent | null {
  const { size, box } = profile;
  const cells = size * size;
  const empty = { size, box, givens: Array<number | null>(cells).fill(null), inequalities: [] };
  const solution = solveGrid(empty, 1, random)[0];
  if (!solution) return null;
  const inequalities: Inequality[] = shuffle(random, adjacentPairs(size))
    .slice(0, profile.inequalities)
    .map(([a, b]) =>
      (solution[a] as number) < (solution[b] as number)
        ? { smaller: a, larger: b }
        : { smaller: b, larger: a },
    );
  const givens: (number | null)[] = [...solution];
  const minGivens = Math.round(cells * profile.givenShare);
  let count = cells;
  // Empty cells one by one while the puzzle keeps a single solution.
  for (const i of shuffle(random, [...Array(cells).keys()])) {
    if (count <= minGivens) break;
    givens[i] = null;
    if (solveGrid({ size, box, givens, inequalities }, 2).length === 1) count--;
    else givens[i] = solution[i] as number;
  }
  const emptyCells = givens.flatMap((v, i) => (v === null ? [i] : []));
  if (emptyCells.length < 2) return null;
  const kind = profile.inequalities > 0 ? 'inequalities' : box ? 'boxes' : 'latin';
  return { kind, size, box, givens, inequalities, asked: pick(random, emptyCells), solution };
}

export const constraintSolverGame: GameDefinition<ConstraintChallenge, ConstraintProfile> = {
  id: CONSTRAINT_SOLVER_ID,
  name: msg('logic:constraintSolver.name'),
  tagline: msg('logic:constraintSolver.tagline'),
  description: msg('logic:constraintSolver.description'),
  area: 'logic',
  skills: ['logical-reasoning', 'problem-solving', 'working-memory', 'spatial-reasoning'],
  meta: {
    category: 'logic',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'numeric',
    estimatedMinutes: 5,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary: msg('logic:constraintSolver.scoringSummary'),
    feedback: 'explain',
  },
  instructions: [
    msg('logic:constraintSolver.instructions.1'),
    msg('logic:constraintSolver.instructions.2'),
    msg('logic:constraintSolver.instructions.3'),
    msg('logic:constraintSolver.instructions.4'),
  ],
  simpleInstructions: msg('logic:constraintSolver.simpleInstructions'),
  levels: CONSTRAINT_LEVELS,
  generate({ identity, profile, random }) {
    const content = retryGeneration('constraint grid', () => buildGrid(random, profile));
    const answer = content.solution[content.asked] as number;
    const { size, asked } = content;
    const row = Math.floor(asked / size);
    const rowValues = joinText(
      content.solution.slice(row * size, row * size + size).map(String),
      ' ',
    );
    const draft: Draft<ConstraintChallenge> = {
      prompt: msg('logic:constraintSolver.prompt', { cell: cellName(asked, size) }),
      content,
      response: numericResponse(answer),
      explanation: msg(
        `logic:constraintSolver.explanation.${content.inequalities.length > 0 ? 'inequalities' : 'plain'}`,
        { row: row + 1, values: rowValues, cell: cellName(asked, size), answer },
      ),
      skills: ['logical-reasoning', 'problem-solving'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
