import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { LoopProfile } from './types';

/**
 * Simple counted loops first (range bounds, off-by-one), then while loops whose end depends on
 * the data, conditions inside the body, nested loops and finally early exits (a `return` inside a
 * loop, or a while condition joined with `and`). Iteration counts grow alongside.
 */
export const LOOP_LEVELS = defineLevels<LoopProfile>([
  {
    objective: msg('programming:loopPrediction.levels.1'),
    challengeCount: 5,
    timing: untimed(30_000),
    kinds: { iterations: 1, 'final-value': 1 },
    structures: { simple: 1 },
    maxIterations: 4,
    answer: 'choice',
  },
  {
    objective: msg('programming:loopPrediction.levels.2'),
    challengeCount: 5,
    timing: untimed(35_000),
    kinds: { iterations: 1, 'final-value': 1 },
    structures: { simple: 1 },
    maxIterations: 5,
    answer: 'choice',
  },
  {
    objective: msg('programming:loopPrediction.levels.3'),
    challengeCount: 6,
    timing: untimed(40_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { simple: 1, conditional: 2 },
    maxIterations: 6,
    answer: 'choice',
  },
  {
    objective: msg('programming:loopPrediction.levels.4'),
    challengeCount: 6,
    timing: untimed(45_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { simple: 1, conditional: 2 },
    maxIterations: 6,
    answer: 'numeric',
  },
  {
    objective: msg('programming:loopPrediction.levels.5'),
    challengeCount: 6,
    timing: untimed(55_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { conditional: 1, nested: 2 },
    maxIterations: 5,
    answer: 'numeric',
  },
  {
    objective: msg('programming:loopPrediction.levels.6'),
    challengeCount: 6,
    timing: untimed(60_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { conditional: 1, nested: 1, 'early-exit': 2 },
    maxIterations: 6,
    answer: 'numeric',
  },
  {
    objective: msg('programming:loopPrediction.levels.7'),
    challengeCount: 7,
    timing: untimed(70_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { simple: 1, conditional: 1, nested: 1, 'early-exit': 1 },
    maxIterations: 7,
    answer: 'numeric',
  },
  {
    objective: msg('programming:loopPrediction.levels.8'),
    challengeCount: 7,
    timing: untimed(80_000),
    kinds: { iterations: 1, 'final-value': 1, 'last-output': 1 },
    structures: { conditional: 1, nested: 2, 'early-exit': 1 },
    maxIterations: 7,
    answer: 'numeric',
  },
  {
    objective: msg('programming:loopPrediction.levels.9'),
    challengeCount: 7,
    timing: untimed(90_000),
    kinds: { iterations: 2, 'final-value': 1, 'last-output': 1 },
    structures: { nested: 1, 'early-exit': 2, conditional: 1 },
    maxIterations: 8,
    answer: 'numeric',
  },
  {
    objective: msg('programming:loopPrediction.levels.10'),
    challengeCount: 8,
    timing: untimed(100_000),
    kinds: { iterations: 2, 'final-value': 1, 'last-output': 1 },
    structures: { nested: 2, 'early-exit': 2, conditional: 1 },
    maxIterations: 9,
    answer: 'numeric',
  },
]);
