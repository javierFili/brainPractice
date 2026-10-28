import { defineLevels, untimed } from '@/games/kit/content';
import type { NumberPatternProfile } from './types';

const base = {
  grid: { rules: ['row-sum'], missingAnywhere: false },
  pyramid: { base: 3, askBottom: false, blanks: 0 },
  wheel: { segments: 6, rules: ['opposite-sum'] },
  cross: { rules: ['sum'] },
} as const;

/**
 * From adding two small numbers in a row to pyramids that need working backwards, wheels with a
 * hidden total and crosses whose centre combines the arms with products. Every layout is checked
 * against the whole rule library, so exactly one number fits.
 */
export const NUMBER_PATTERN_LEVELS = defineLevels<NumberPatternProfile>([
  {
    ...base,
    objective: 'Each row adds up: first plus second gives the third.',
    challengeCount: 5,
    kinds: { grid: 1 },
    maxValue: 5,
    timing: untimed(20_000),
  },
  {
    ...base,
    objective: 'Sums in rows or in columns, with the gap anywhere.',
    challengeCount: 5,
    kinds: { grid: 1 },
    maxValue: 9,
    grid: { rules: ['row-sum', 'column-sum'], missingAnywhere: true },
    timing: untimed(25_000),
  },
  {
    ...base,
    objective: 'Number pyramids: each brick is the sum of the two below.',
    challengeCount: 5,
    kinds: { pyramid: 2, grid: 1 },
    maxValue: 9,
    grid: { rules: ['row-sum', 'column-sum'], missingAnywhere: true },
    timing: untimed(30_000),
  },
  {
    ...base,
    objective: 'Rows that subtract or move by a fixed step.',
    challengeCount: 6,
    kinds: { grid: 2, pyramid: 1 },
    maxValue: 12,
    grid: {
      rules: ['row-difference', 'column-difference', 'row-step', 'column-step'],
      missingAnywhere: true,
    },
    timing: untimed(35_000),
  },
  {
    ...base,
    objective: 'Wheels: opposite segments share a hidden link.',
    challengeCount: 6,
    kinds: { wheel: 2, grid: 1 },
    maxValue: 12,
    grid: {
      rules: ['row-difference', 'column-difference', 'row-step', 'column-step'],
      missingAnywhere: true,
    },
    timing: untimed(40_000),
  },
  {
    ...base,
    objective: 'Bigger pyramids where you may have to work backwards.',
    challengeCount: 6,
    kinds: { pyramid: 2, wheel: 1 },
    maxValue: 12,
    pyramid: { base: 4, askBottom: true, blanks: 0 },
    wheel: { segments: 6, rules: ['opposite-sum', 'opposite-difference'] },
    timing: untimed(45_000),
  },
  {
    ...base,
    objective: 'Grids where rows and columns work together.',
    pyramid: { base: 4, askBottom: true, blanks: 0 },
    challengeCount: 6,
    kinds: { grid: 2, wheel: 1 },
    maxValue: 15,
    grid: { rules: ['add-table', 'row-total', 'column-total'], missingAnywhere: true },
    wheel: { segments: 8, rules: ['opposite-sum', 'opposite-difference'] },
    timing: untimed(50_000),
  },
  {
    ...base,
    objective: 'Crosses: find how the arms make the centre.',
    pyramid: { base: 4, askBottom: true, blanks: 0 },
    challengeCount: 6,
    kinds: { cross: 2, grid: 1 },
    maxValue: 15,
    grid: { rules: ['add-table', 'row-total', 'column-total'], missingAnywhere: true },
    cross: { rules: ['sum', 'vertical-minus-horizontal'] },
    timing: untimed(55_000),
  },
  {
    ...base,
    objective: 'Pyramids with extra blank bricks, and mixed layouts.',
    challengeCount: 6,
    kinds: { pyramid: 2, cross: 1, wheel: 1 },
    maxValue: 15,
    pyramid: { base: 4, askBottom: true, blanks: 2 },
    wheel: { segments: 8, rules: ['opposite-sum', 'opposite-difference'] },
    cross: { rules: ['sum', 'vertical-minus-horizontal'] },
    timing: untimed(60_000),
  },
  {
    ...base,
    objective: 'Every layout, with products and five-brick pyramids.',
    challengeCount: 6,
    kinds: { grid: 1, pyramid: 1, cross: 1, wheel: 1 },
    maxValue: 15,
    grid: {
      rules: ['row-product', 'column-product', 'add-table', 'row-total'],
      missingAnywhere: true,
    },
    pyramid: { base: 5, askBottom: true, blanks: 3 },
    wheel: { segments: 8, rules: ['opposite-sum', 'opposite-difference'] },
    cross: { rules: ['product-sum', 'product-difference', 'vertical-minus-horizontal'] },
    timing: untimed(70_000),
  },
]);
