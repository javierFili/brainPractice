import { defineLevels, untimed } from '@/games/kit/content';
import type { LoopProfile } from './types';

/**
 * Simple counted loops first (range bounds, off-by-one), then while loops whose end depends on
 * the data, conditions inside the body, nested loops and finally early exits (a `return` inside a
 * loop, or a while condition joined with `and`). Iteration counts grow alongside.
 */
export const LOOP_LEVELS = defineLevels<LoopProfile>([
  {
    objective: 'Count the turns of a simple loop and add up as it goes.',
    challengeCount: 5,
    timing: untimed(30_000),
    kinds: { iterations: 1, 'final-value': 1 },
    structures: { simple: 1 },
    maxIterations: 4,
    answer: 'choice',
  },
  {
    objective: 'While loops: the condition is checked before every turn.',
    challengeCount: 5,
    timing: untimed(35_000),
    kinds: { iterations: 1, 'final-value': 1 },
    structures: { simple: 1 },
    maxIterations: 5,
    answer: 'choice',
  },
  {
    objective: 'An if inside the loop: not every turn changes the total.',
    challengeCount: 6,
    timing: untimed(40_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { simple: 1, conditional: 2 },
    maxIterations: 6,
    answer: 'choice',
  },
  {
    objective: 'Exact answers: type the number.',
    challengeCount: 6,
    timing: untimed(45_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { simple: 1, conditional: 2 },
    maxIterations: 6,
    answer: 'numeric',
  },
  {
    objective: 'A loop inside a loop: the inner one restarts every outer turn.',
    challengeCount: 6,
    timing: untimed(55_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { conditional: 1, nested: 2 },
    maxIterations: 5,
    answer: 'numeric',
  },
  {
    objective: 'Early exits: a return inside a loop ends it at once.',
    challengeCount: 6,
    timing: untimed(60_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { conditional: 1, nested: 1, 'early-exit': 2 },
    maxIterations: 6,
    answer: 'numeric',
  },
  {
    objective: 'Longer loops of every kind.',
    challengeCount: 7,
    timing: untimed(70_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { simple: 1, conditional: 1, nested: 1, 'early-exit': 1 },
    maxIterations: 7,
    answer: 'numeric',
  },
  {
    objective: 'Inner loops whose length depends on the outer variable.',
    challengeCount: 7,
    timing: untimed(80_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { conditional: 1, nested: 2, 'early-exit': 1 },
    maxIterations: 7,
    answer: 'numeric',
  },
  {
    objective: 'Stop conditions joined with “and”: which one ends the loop first?',
    challengeCount: 7,
    timing: untimed(90_000),
    kinds: { iterations: 2, 'final-value': 1, 'last-output': 1 },
    structures: { nested: 1, 'early-exit': 2, conditional: 1 },
    maxIterations: 8,
    answer: 'numeric',
  },
  {
    objective: 'Everything at once, with up to nine turns per loop.',
    challengeCount: 8,
    timing: untimed(100_000),
    kinds: { iterations: 2, 'final-value': 1, 'last-output': 1 },
    structures: { nested: 2, 'early-exit': 2, conditional: 1 },
    maxIterations: 9,
    answer: 'numeric',
  },
]);
