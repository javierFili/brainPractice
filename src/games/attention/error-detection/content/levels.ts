import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { ErrorDetectionProfile } from './types';

const check = (rows: number) => untimed(6000 + rows * 2500);

/**
 * One kind of list at a time with clear errors (a number far out of place, a total off by a euro),
 * then mixed lists, receipts with a grand total, look-alike characters (0/O, 8/B) and small
 * errors (10 cents, 5 minutes) in longer lists.
 */
export const ERROR_DETECTION_LEVELS = defineLevels<ErrorDetectionProfile>([
  {
    objective: msg('attention:errorDetection.levels.1'),
    challengeCount: 5,
    kinds: { sorted: 1 },
    items: 5,
    subtle: false,
    withTotal: false,
    timing: check(5),
  },
  {
    objective: msg('attention:errorDetection.levels.2'),
    challengeCount: 5,
    kinds: { spelling: 1 },
    items: 6,
    subtle: false,
    withTotal: false,
    timing: check(6),
  },
  {
    objective: msg('attention:errorDetection.levels.3'),
    challengeCount: 5,
    kinds: { receipt: 1 },
    items: 6,
    subtle: false,
    withTotal: false,
    timing: check(6),
  },
  {
    objective: msg('attention:errorDetection.levels.4'),
    challengeCount: 5,
    kinds: { copy: 1 },
    items: 6,
    subtle: false,
    withTotal: false,
    timing: check(6),
  },
  {
    objective: msg('attention:errorDetection.levels.5'),
    challengeCount: 5,
    kinds: { schedule: 1 },
    items: 6,
    subtle: false,
    withTotal: false,
    timing: check(6),
  },
  {
    objective: msg('attention:errorDetection.levels.6'),
    challengeCount: 5,
    kinds: { sorted: 1, spelling: 1, receipt: 1, copy: 1, schedule: 1 },
    items: 7,
    subtle: false,
    withTotal: false,
    timing: check(7),
  },
  {
    objective: msg('attention:errorDetection.levels.7'),
    challengeCount: 5,
    kinds: { receipt: 1 },
    items: 7,
    subtle: true,
    withTotal: true,
    timing: check(7),
  },
  {
    objective: msg('attention:errorDetection.levels.8'),
    challengeCount: 5,
    kinds: { copy: 1 },
    items: 8,
    subtle: true,
    withTotal: true,
    timing: check(8),
  },
  {
    objective: msg('attention:errorDetection.levels.9'),
    challengeCount: 5,
    kinds: { sorted: 1, spelling: 1, receipt: 1, copy: 1, schedule: 1 },
    items: 9,
    subtle: true,
    withTotal: true,
    timing: check(9),
  },
  {
    objective: msg('attention:errorDetection.levels.10'),
    challengeCount: 5,
    kinds: { sorted: 1, spelling: 1, receipt: 1, copy: 1, schedule: 1 },
    items: 10,
    subtle: true,
    withTotal: true,
    timing: check(10),
  },
]);
