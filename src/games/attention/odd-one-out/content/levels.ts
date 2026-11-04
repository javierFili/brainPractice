import { msg } from '@/domain/shared';
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
    objective: msg('attention:oddOneOut.levels.1'),
    challengeCount: 5,
    changes: ['color'],
    columns: 3,
    rows: 3,
    subtle: false,
    timing: search(9),
  },
  {
    objective: msg('attention:oddOneOut.levels.2'),
    challengeCount: 5,
    changes: ['color'],
    columns: 4,
    rows: 4,
    subtle: false,
    timing: search(16),
  },
  {
    objective: msg('attention:oddOneOut.levels.3'),
    challengeCount: 6,
    changes: ['shape'],
    columns: 4,
    rows: 4,
    subtle: false,
    timing: search(16),
  },
  {
    objective: msg('attention:oddOneOut.levels.4'),
    challengeCount: 6,
    changes: ['shape'],
    columns: 4,
    rows: 5,
    subtle: true,
    timing: search(20),
  },
  {
    objective: msg('attention:oddOneOut.levels.5'),
    challengeCount: 6,
    changes: ['turn'],
    columns: 5,
    rows: 5,
    subtle: false,
    timing: search(25),
  },
  {
    objective: msg('attention:oddOneOut.levels.6'),
    challengeCount: 6,
    changes: ['color'],
    columns: 5,
    rows: 6,
    subtle: true,
    timing: search(30),
  },
  {
    objective: msg('attention:oddOneOut.levels.7'),
    challengeCount: 6,
    changes: ['turn'],
    columns: 6,
    rows: 6,
    subtle: true,
    timing: search(36),
  },
  {
    objective: msg('attention:oddOneOut.levels.8'),
    challengeCount: 6,
    changes: ['mirror'],
    columns: 6,
    rows: 6,
    subtle: false,
    timing: search(36),
  },
  {
    objective: msg('attention:oddOneOut.levels.9'),
    challengeCount: 6,
    changes: ['color', 'shape', 'turn', 'mirror'],
    columns: 6,
    rows: 7,
    subtle: true,
    timing: search(42),
  },
  {
    objective: msg('attention:oddOneOut.levels.10'),
    challengeCount: 6,
    changes: ['color', 'shape', 'turn', 'mirror'],
    columns: 6,
    rows: 8,
    subtle: true,
    timing: search(48),
  },
]);
