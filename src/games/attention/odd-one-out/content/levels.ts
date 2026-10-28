import { defineLevels, untimed } from '@/games/kit/content';
import type { OddOneOutProfile } from './types';

const search = (cells: number) => untimed(4000 + cells * 250);

/**
 * From an obvious colour difference on 3×3 to a single mirrored or turned shape hidden among 48:
 * the difference changes feature (colour → shape → orientation → mirroring → any), gets finer
 * (nearest colour or outline, quarter turns) and the grid grows.
 */
export const ODD_ONE_OUT_LEVELS = defineLevels<OddOneOutProfile>([
  {
    objective: 'Spot the one shape in a different colour (3×3).',
    challengeCount: 5,
    changes: ['color'],
    columns: 3,
    rows: 3,
    subtle: false,
    timing: search(9),
  },
  {
    objective: 'Spot the different colour in a bigger 4×4 grid.',
    challengeCount: 5,
    changes: ['color'],
    columns: 4,
    rows: 4,
    subtle: false,
    timing: search(16),
  },
  {
    objective: 'Now the odd one is a different shape, same colour.',
    challengeCount: 6,
    changes: ['shape'],
    columns: 4,
    rows: 4,
    subtle: false,
    timing: search(16),
  },
  {
    objective: 'Spot a shape with a similar outline (square vs diamond…).',
    challengeCount: 6,
    changes: ['shape'],
    columns: 4,
    rows: 5,
    subtle: true,
    timing: search(20),
  },
  {
    objective: 'Same shape, same colour — one points another way.',
    challengeCount: 6,
    changes: ['turn'],
    columns: 5,
    rows: 5,
    subtle: false,
    timing: search(25),
  },
  {
    objective: 'Spot a nearby colour (red vs orange…) among 30.',
    challengeCount: 6,
    changes: ['color'],
    columns: 5,
    rows: 6,
    subtle: true,
    timing: search(30),
  },
  {
    objective: 'One shape is turned only a quarter turn (6×6).',
    challengeCount: 6,
    changes: ['turn'],
    columns: 6,
    rows: 6,
    subtle: true,
    timing: search(36),
  },
  {
    objective: 'One L shape is mirrored.',
    challengeCount: 6,
    changes: ['mirror'],
    columns: 6,
    rows: 6,
    subtle: false,
    timing: search(36),
  },
  {
    objective: 'Any feature can differ, finely: colour, outline, turn or mirror.',
    challengeCount: 6,
    changes: ['color', 'shape', 'turn', 'mirror'],
    columns: 6,
    rows: 7,
    subtle: true,
    timing: search(42),
  },
  {
    objective: 'Any fine difference among 48 shapes.',
    challengeCount: 6,
    changes: ['color', 'shape', 'turn', 'mirror'],
    columns: 6,
    rows: 8,
    subtle: true,
    timing: search(48),
  },
]);
