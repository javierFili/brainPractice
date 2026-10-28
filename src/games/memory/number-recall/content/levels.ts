import { defineLevels, untimed } from '@/games/kit/content';
import type { NumberRecallProfile } from './types';

const look = (digits: number, msPerDigit: number) =>
  untimed(digits * 800 + 4000, digits * msPerDigit + 1500);

/**
 * Digits to hold grow from 4 to 12. Levels add new demands rather than only more digits: picking a
 * chunk by its position (order, not just content), and holding two labelled numbers at once
 * without knowing which one will be asked.
 */
export const NUMBER_RECALL_LEVELS = defineLevels<NumberRecallProfile>([
  {
    objective: 'Type back a 4-digit code shown as two pairs.',
    challengeCount: 5,
    variants: [{ kind: 'type-back', groups: [2, 2] }],
    timing: look(4, 900),
  },
  {
    objective: 'Type back a 5-digit number in two chunks.',
    challengeCount: 5,
    variants: [{ kind: 'type-back', groups: [2, 3] }],
    timing: look(5, 850),
  },
  {
    objective: 'Type back a 6-digit number in two chunks.',
    challengeCount: 5,
    variants: [{ kind: 'type-back', groups: [3, 3] }],
    timing: look(6, 800),
  },
  {
    objective: 'Remember three pairs of digits and the order they came in.',
    challengeCount: 5,
    variants: [{ kind: 'which-group', groups: [2, 2, 2] }],
    timing: look(6, 800),
  },
  {
    objective: 'Type back a 7-digit phone number.',
    challengeCount: 5,
    variants: [{ kind: 'type-back', groups: [3, 4] }],
    timing: look(7, 750),
  },
  {
    objective: 'Hold two 4-digit numbers; one of them will be asked.',
    challengeCount: 5,
    variants: [{ kind: 'two-numbers', groups: [2, 2] }],
    timing: look(8, 750),
  },
  {
    objective: 'Remember three chunks of three digits in order.',
    challengeCount: 5,
    variants: [{ kind: 'which-group', groups: [3, 3, 3] }],
    timing: look(9, 700),
  },
  {
    objective: 'Type back a 9-digit number, or hold two 5-digit numbers.',
    challengeCount: 5,
    variants: [
      { kind: 'type-back', groups: [3, 3, 3] },
      { kind: 'two-numbers', groups: [2, 3] },
    ],
    timing: look(10, 650),
  },
  {
    objective: 'Hold two 6-digit numbers at once.',
    challengeCount: 4,
    variants: [{ kind: 'two-numbers', groups: [3, 3] }],
    timing: look(12, 600),
  },
  {
    objective: 'Four chunks in order, or two 6-digit numbers: any can be asked.',
    challengeCount: 4,
    variants: [
      { kind: 'which-group', groups: [3, 3, 3, 3] },
      { kind: 'two-numbers', groups: [3, 3] },
    ],
    timing: look(12, 550),
  },
]);
