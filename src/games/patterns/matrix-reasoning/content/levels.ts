import { defineLevels, untimed } from '@/games/kit/content';
import type { MatrixProfile, MatrixRule } from './types';

const LINES: readonly MatrixRule[] = ['by-row', 'by-column'];
const LATIN: readonly MatrixRule[] = ['latin-down', 'latin-up'];
const STEPS: readonly MatrixRule[] = ['step-row', 'step-column'];

/**
 * 2×2 matrices with one feature, then 3×3 with rows and columns, latin squares, counts that step,
 * arrows that turn, the gap moving anywhere, and up to three features following different rules.
 */
export const MATRIX_LEVELS = defineLevels<MatrixProfile>([
  {
    objective: 'Complete a 2×2 matrix where one feature changes.',
    challengeCount: 5,
    size: 2,
    rules: { shape: LINES, color: LINES },
    varying: 1,
    anywhere: false,
    options: 3,
    timing: untimed(15_000),
  },
  {
    objective: 'A 2×2 matrix where shape and colour follow different rules.',
    challengeCount: 5,
    size: 2,
    rules: { shape: LINES, color: LINES },
    varying: 2,
    anywhere: false,
    options: 4,
    timing: untimed(18_000),
  },
  {
    objective: 'A 3×3 matrix: rows or columns share a feature.',
    challengeCount: 6,
    size: 3,
    rules: { shape: LINES, color: LINES },
    varying: 1,
    anywhere: false,
    options: 4,
    timing: untimed(20_000),
  },
  {
    objective: 'A 3×3 matrix where shape and colour both follow rules.',
    challengeCount: 6,
    size: 3,
    rules: { shape: LINES, color: LINES },
    varying: 2,
    anywhere: false,
    options: 4,
    timing: untimed(24_000),
  },
  {
    objective: 'Each value once in every row and column.',
    challengeCount: 6,
    size: 3,
    rules: { shape: [...LINES, ...LATIN], color: [...LINES, ...LATIN] },
    varying: 2,
    anywhere: false,
    options: 4,
    timing: untimed(26_000),
  },
  {
    objective: 'The number of shapes joins in, sometimes counting up.',
    challengeCount: 6,
    size: 3,
    rules: {
      shape: [...LINES, ...LATIN],
      color: [...LINES, ...LATIN],
      count: [...LINES, ...STEPS],
    },
    varying: 2,
    anywhere: false,
    options: 6,
    timing: untimed(28_000),
  },
  {
    objective: 'Three features at once, and the gap can be anywhere.',
    challengeCount: 6,
    size: 3,
    rules: {
      shape: [...LINES, ...LATIN],
      color: [...LINES, ...LATIN],
      count: [...LINES, ...STEPS],
    },
    varying: 3,
    anywhere: true,
    options: 6,
    timing: untimed(32_000),
  },
  {
    objective: 'Arrows that turn step by step, with colour and count rules.',
    challengeCount: 6,
    size: 3,
    rules: {
      rotation: [...STEPS, ...LATIN],
      color: [...LINES, ...LATIN],
      count: [...LINES, ...STEPS],
    },
    varying: 3,
    anywhere: true,
    options: 6,
    timing: untimed(34_000),
  },
  {
    objective: 'Three features, only latin squares and steps, eight options.',
    challengeCount: 6,
    size: 3,
    rules: { shape: LATIN, color: LATIN, count: STEPS },
    varying: 3,
    anywhere: true,
    options: 8,
    timing: untimed(36_000),
  },
  {
    objective: 'Arrows or shapes, every feature on its own hard rule, eight options.',
    challengeCount: 6,
    size: 3,
    rules: {
      shape: LATIN,
      rotation: [...STEPS, ...LATIN],
      color: LATIN,
      count: [...STEPS, ...LATIN],
    },
    varying: 3,
    anywhere: true,
    options: 8,
    timing: untimed(40_000),
  },
]);
