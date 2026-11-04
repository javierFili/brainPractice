import { msg } from '@/domain/shared';
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
    objective: msg('patterns:matrixReasoning.levels.1'),
    challengeCount: 5,
    size: 2,
    rules: { shape: LINES, color: LINES },
    varying: 1,
    anywhere: false,
    options: 3,
    timing: untimed(15_000),
  },
  {
    objective: msg('patterns:matrixReasoning.levels.2'),
    challengeCount: 5,
    size: 2,
    rules: { shape: LINES, color: LINES },
    varying: 2,
    anywhere: false,
    options: 4,
    timing: untimed(18_000),
  },
  {
    objective: msg('patterns:matrixReasoning.levels.3'),
    challengeCount: 6,
    size: 3,
    rules: { shape: LINES, color: LINES },
    varying: 1,
    anywhere: false,
    options: 4,
    timing: untimed(20_000),
  },
  {
    objective: msg('patterns:matrixReasoning.levels.4'),
    challengeCount: 6,
    size: 3,
    rules: { shape: LINES, color: LINES },
    varying: 2,
    anywhere: false,
    options: 4,
    timing: untimed(24_000),
  },
  {
    objective: msg('patterns:matrixReasoning.levels.5'),
    challengeCount: 6,
    size: 3,
    rules: { shape: [...LINES, ...LATIN], color: [...LINES, ...LATIN] },
    varying: 2,
    anywhere: false,
    options: 4,
    timing: untimed(26_000),
  },
  {
    objective: msg('patterns:matrixReasoning.levels.6'),
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
    objective: msg('patterns:matrixReasoning.levels.7'),
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
    objective: msg('patterns:matrixReasoning.levels.8'),
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
    objective: msg('patterns:matrixReasoning.levels.9'),
    challengeCount: 6,
    size: 3,
    rules: { shape: LATIN, color: LATIN, count: STEPS },
    varying: 3,
    anywhere: true,
    options: 8,
    timing: untimed(36_000),
  },
  {
    objective: msg('patterns:matrixReasoning.levels.10'),
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
