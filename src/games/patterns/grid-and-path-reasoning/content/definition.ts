import { numericResponse } from '@/domain/challenge';
import { retryGeneration, type GameDefinition } from '@/domain/game';
import {
  chance,
  randomInt,
  sample,
  shuffle,
  weightedPick,
  type RandomGenerator,
} from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
import { listWords, orderedChoice, type Draft } from '../../shared/content';
import { GRID_PATH_LEVELS } from './levels';
import {
  distances,
  exitLabel,
  manhattan,
  neighbours,
  markLabel,
  rowOf,
  colOf,
  routeWords,
  type Maze,
} from './maze';
import type { GridPathChallenge, GridPathContent, GridPathProfile } from './types';

export const GRID_PATH_ID = gameIdOf('grid-and-path-reasoning');

type PathDraft = Draft<GridPathChallenge>;
const INF = Number.POSITIVE_INFINITY;

function randomMaze(random: RandomGenerator, profile: GridPathProfile, keep: readonly number[]) {
  const cells = profile.size * profile.size;
  const walls = new Set<number>();
  for (let i = 0; i < cells; i++)
    if (!keep.includes(i) && chance(random, profile.density)) walls.add(i);
  return { size: profile.size, walls } satisfies Maze;
}

const openCells = (maze: Maze) =>
  Array.from({ length: maze.size * maze.size }, (_, i) => i).filter((i) => !maze.walls.has(i));

const content = (
  kind: GridPathContent['kind'],
  maze: Maze,
  rest: Pick<GridPathContent, 'start' | 'goal' | 'exits' | 'marks'>,
): GridPathContent => ({
  kind,
  size: maze.size,
  walls: [...maze.walls].sort((a, b) => a - b),
  ...rest,
});

/** Start and goal far enough apart that the walls force the required detour. */
function startAndGoal(random: RandomGenerator, profile: GridPathProfile) {
  const cells = profile.size * profile.size;
  const start = randomInt(random, 0, cells - 1);
  const goal = randomInt(random, 0, cells - 1);
  if (manhattan(start, goal, profile.size) < Math.min(profile.minDistance, 2 * profile.size - 3))
    return null;
  const maze = randomMaze(random, profile, [start, goal]);
  const fromStart = distances(maze, start);
  const steps = fromStart.dist[goal] as number;
  if (steps === INF || steps < profile.minDistance) return null;
  if (steps < manhattan(start, goal, profile.size) + profile.detour) return null;
  return { start, goal, maze, fromStart, steps };
}

function shortestLength(random: RandomGenerator, profile: GridPathProfile): PathDraft | null {
  const found = startAndGoal(random, profile);
  if (found === null) return null;
  const { start, goal, maze, fromStart, steps } = found;
  return {
    prompt: 'How many steps is the shortest route from the turtle to the star?',
    content: content('shortest-length', maze, { start, goal, exits: [], marks: [] }),
    response: numericResponse(steps, 'steps'),
    explanation: `The shortest route takes ${steps} steps, for example: ${routeWords(fromStart.parent, goal)}. No route avoids the walls with fewer steps.`,
    skills: ['spatial-reasoning', 'planning'],
  };
}

const onBorder = (cell: number, size: number) => {
  const r = rowOf(cell, size);
  const c = colOf(cell, size);
  return r === 0 || c === 0 || r === size - 1 || c === size - 1;
};

function reachableExit(random: RandomGenerator, profile: GridPathProfile): PathDraft | null {
  const { size } = profile;
  const start = randomInt(random, 0, size * size - 1);
  if (onBorder(start, size)) return null;
  const maze = randomMaze(random, profile, [start]);
  const { dist, parent } = distances(maze, start);
  const border = openCells(maze).filter((c) => c !== start && onBorder(c, size));
  const reachable = border.filter((c) => dist[c] !== INF && (dist[c] as number) >= 2);
  // Cut-off exits close to the start make the walls, not the distance, decide.
  const blocked = border.filter((c) => dist[c] === INF && manhattan(c, start, size) <= size + 1);
  if (reachable.length === 0 || blocked.length < profile.exits - 1) return null;
  const right = reachable[randomInt(random, 0, reachable.length - 1)] as number;
  const exits = shuffle(random, [right, ...sample(random, blocked, profile.exits - 1)]);
  const index = exits.indexOf(right);
  const labels = exits.map((_, i) => exitLabel(i));
  const others = labels.filter((_, i) => i !== index);
  return {
    prompt:
      'Which exit can the turtle reach? It moves up, down, left or right, never through walls.',
    content: content('reachable-exit', maze, { start, goal: null, exits, marks: [] }),
    response: orderedChoice(labels, index),
    explanation: `${labels[index] ?? ''} can be reached, for example: ${routeWords(parent, right)}. ${listWords(others)} ${others.length === 1 ? 'is' : 'are'} cut off by walls: no route leads there.`,
    skills: ['spatial-reasoning', 'visual-orientation'],
  };
}

/** Number of distinct shortest routes from the BFS source, per cell. */
function routeCounts(maze: Maze, dist: readonly number[]) {
  const order = dist
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d !== INF)
    .sort((a, b) => a.d - b.d);
  const count = new Array<number>(dist.length).fill(0);
  const first = order[0];
  if (first) count[first.i] = 1;
  for (const { d, i } of order) {
    if (d === 0) continue;
    count[i] = neighbours(maze, i)
      .filter((n) => dist[n] === d - 1)
      .reduce((sum, n) => sum + (count[n] as number), 0);
  }
  return count;
}

function mustPass(random: RandomGenerator, profile: GridPathProfile): PathDraft | null {
  const found = startAndGoal(random, profile);
  if (found === null) return null;
  const { start, goal, maze, fromStart, steps } = found;
  const fromGoal = distances(maze, goal);
  const viaStart = routeCounts(maze, fromStart.dist);
  const viaGoal = routeCounts(maze, fromGoal.dist);
  const total = viaStart[goal] as number;
  if (profile.multiplePaths && total < 2) return null;
  const open = openCells(maze).filter((c) => c !== start && c !== goal);
  const span = (c: number) => (fromStart.dist[c] as number) + (fromGoal.dist[c] as number);
  // On every shortest route: the routes through the cell are all of them.
  const musts = open.filter(
    (c) => span(c) === steps && (viaStart[c] as number) * (viaGoal[c] as number) === total,
  );
  // On no shortest route, but close to one, so it looks tempting.
  const nevers = open.filter((c) => span(c) > steps && span(c) <= steps + 4);
  if (musts.length === 0 || nevers.length < profile.marks - 1) return null;
  if (profile.multiplePaths && !open.some((c) => span(c) === steps && !musts.includes(c)))
    return null;
  const right = musts[randomInt(random, 0, musts.length - 1)] as number;
  const marks = shuffle(random, [right, ...sample(random, nevers, profile.marks - 1)]);
  const index = marks.indexOf(right);
  const labels = marks.map((_, i) => markLabel(i));
  const others = labels.filter((_, i) => i !== index);
  return {
    prompt:
      'Every shortest route from the turtle to the star passes through one of the numbered cells. Which one?',
    content: content('must-pass', maze, { start, goal, exits: [], marks }),
    response: orderedChoice(labels, index),
    explanation: `The shortest routes take ${steps} steps${total > 1 ? ` (there are ${total} of them)` : ''}, and every one passes through ${labels[index] ?? ''}. Going through ${listWords(others)} makes the route longer.`,
    skills: ['spatial-reasoning', 'planning', 'problem-solving'],
  };
}

const GENERATORS = {
  'shortest-length': shortestLength,
  'reachable-exit': reachableExit,
  'must-pass': mustPass,
} as const;

export const gridPathGame: GameDefinition<GridPathChallenge, GridPathProfile> = {
  id: GRID_PATH_ID,
  name: 'Grid and Path Reasoning',
  tagline: 'Find your way through the maze.',
  description:
    'A turtle moves through a grid maze, one square at a time, up, down, left or right, never through walls. Count the steps of the shortest route, find the only exit it can reach, or spot the cell every shortest route must cross.',
  area: 'patterns',
  skills: ['spatial-reasoning', 'planning', 'visual-orientation', 'problem-solving'],
  meta: {
    category: 'patterns',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'mixed',
    estimatedMinutes: 4,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy'],
    scoringSummary:
      'Each maze counts as correct when your number or choice is right. Your result is the share of mazes solved; there is no time limit.',
    feedback: 'explain',
    accessibilityNotes:
      'Each maze is also described row by row for screen readers, but following routes by ear is demanding on the larger mazes.',
  },
  instructions: [
    'The turtle moves one square at a time: up, down, left or right. It cannot cross walls (striped squares) or move diagonally.',
    'A step is one move to the next square. Count the steps of the shortest route when asked.',
    'Exits are lettered; numbered cells are the candidates when you must find the cell every shortest route crosses.',
  ],
  simpleInstructions: 'Help the turtle find its way around the walls.',
  levels: GRID_PATH_LEVELS,
  generate({ identity, profile, random }) {
    const kind = weightedPick(random, profile.kinds);
    const draft = retryGeneration(`maze (${kind})`, () => GENERATORS[kind](random, profile), 400);
    return { ...identity, ...draft, timing: profile.timing };
  },
};
