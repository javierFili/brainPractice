import { defineLevels, untimed } from '@/games/kit/content';
import type { VisualDifferenceProfile } from './types';

const look = (cells: number, differences: number) =>
  untimed(5000 + cells * 300 + differences * 3000);

/**
 * Pictures grow from 3×3 to 6×6 and the differences from 1 to 6, from clear colour/shape swaps to
 * nearby colours, similar outlines, quarter turns and mirrored L shapes in busier pictures.
 */
export const VISUAL_DIFFERENCE_LEVELS = defineLevels<VisualDifferenceProfile>([
  {
    objective: 'Find 1 difference between two 3×3 pictures.',
    challengeCount: 5,
    columns: 3,
    differences: 1,
    changes: ['color', 'shape'],
    palette: 3,
    subtle: false,
    timing: look(9, 1),
  },
  {
    objective: 'Find 2 differences in 3×3 pictures.',
    challengeCount: 5,
    columns: 3,
    differences: 2,
    changes: ['color', 'shape'],
    palette: 4,
    subtle: false,
    timing: look(9, 2),
  },
  {
    objective: 'Find 2 differences in bigger 4×4 pictures.',
    challengeCount: 5,
    columns: 4,
    differences: 2,
    changes: ['color', 'shape'],
    palette: 4,
    subtle: false,
    timing: look(16, 2),
  },
  {
    objective: 'Find 3 differences in 4×4 pictures.',
    challengeCount: 5,
    columns: 4,
    differences: 3,
    changes: ['color', 'shape'],
    palette: 5,
    subtle: false,
    timing: look(16, 3),
  },
  {
    objective: 'Shapes can now be turned, too: 3 differences.',
    challengeCount: 5,
    columns: 4,
    differences: 3,
    changes: ['color', 'shape', 'turn'],
    palette: 5,
    subtle: false,
    timing: look(16, 3),
  },
  {
    objective: 'Find 3 fine differences in 5×5 pictures.',
    challengeCount: 5,
    columns: 5,
    differences: 3,
    changes: ['color', 'shape', 'turn'],
    palette: 6,
    subtle: true,
    timing: look(25, 3),
  },
  {
    objective: 'Find 4 differences, including mirrored L shapes.',
    challengeCount: 5,
    columns: 5,
    differences: 4,
    changes: ['color', 'turn', 'mirror'],
    palette: 6,
    subtle: false,
    timing: look(25, 4),
  },
  {
    objective: 'Find 4 fine differences of any kind.',
    challengeCount: 5,
    columns: 5,
    differences: 4,
    changes: ['color', 'shape', 'turn', 'mirror'],
    palette: 7,
    subtle: true,
    timing: look(25, 4),
  },
  {
    objective: 'Find 5 fine differences in 6×6 pictures.',
    challengeCount: 5,
    columns: 6,
    differences: 5,
    changes: ['color', 'shape', 'turn', 'mirror'],
    palette: 8,
    subtle: true,
    timing: look(36, 5),
  },
  {
    objective: 'Find 6 fine differences in busy 6×6 pictures.',
    challengeCount: 5,
    columns: 6,
    differences: 6,
    changes: ['color', 'shape', 'turn', 'mirror'],
    palette: 10,
    subtle: true,
    timing: look(36, 6),
  },
]);
