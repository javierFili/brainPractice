import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import { pick, shuffle, type RandomGenerator } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
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
  name: 'Constraint Solver',
  tagline: 'Fill the grid in your head and find one number.',
  description:
    'Each row and each column holds every number once. Use the numbers already given — and, at higher levels, boxes and “smaller than” signs — to work out the number in the highlighted cell.',
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
    scoringSummary:
      'Each grid has exactly one solution. Your result is the share of highlighted cells you work out correctly; there is no time limit.',
    feedback: 'explain',
  },
  instructions: [
    'Every row and every column must contain each number exactly once.',
    'When boxes are drawn, each box must also contain each number once.',
    'A clue like “A1 < B1” means the number in A1 is smaller than the number in B1.',
    'Type the number that belongs in the highlighted cell (marked “?”).',
  ],
  simpleInstructions: 'No number twice in a row or column — find the missing one.',
  levels: CONSTRAINT_LEVELS,
  generate({ identity, profile, random }) {
    const content = retryGeneration('constraint grid', () => buildGrid(random, profile));
    const answer = content.solution[content.asked] as number;
    const { size, asked } = content;
    const row = Math.floor(asked / size);
    const rowValues = content.solution.slice(row * size, row * size + size).join(' ');
    const draft: Draft<ConstraintChallenge> = {
      prompt: `Which number goes in cell ${cellName(asked, size)}?`,
      content,
      response: numericResponse(answer),
      explanation: `The grid has only one solution that keeps every rule${content.inequalities.length > 0 ? ', including the “smaller than” clues' : ''}. In it, row ${row + 1} reads ${rowValues}, so ${cellName(asked, size)} is ${answer}.`,
      skills: ['logical-reasoning', 'problem-solving'],
    };
    return { ...identity, ...draft, timing: profile.timing };
  },
};
