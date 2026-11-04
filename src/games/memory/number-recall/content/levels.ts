import { msg } from '@/domain/shared';
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
    objective: msg('memory:numberRecall.levels.1'),
    challengeCount: 5,
    variants: [{ kind: 'type-back', groups: [2, 2] }],
    timing: look(4, 900),
  },
  {
    objective: msg('memory:numberRecall.levels.2'),
    challengeCount: 5,
    variants: [{ kind: 'type-back', groups: [2, 3] }],
    timing: look(5, 850),
  },
  {
    objective: msg('memory:numberRecall.levels.3'),
    challengeCount: 5,
    variants: [{ kind: 'type-back', groups: [3, 3] }],
    timing: look(6, 800),
  },
  {
    objective: msg('memory:numberRecall.levels.4'),
    challengeCount: 5,
    variants: [{ kind: 'which-group', groups: [2, 2, 2] }],
    timing: look(6, 800),
  },
  {
    objective: msg('memory:numberRecall.levels.5'),
    challengeCount: 5,
    variants: [{ kind: 'type-back', groups: [3, 4] }],
    timing: look(7, 750),
  },
  {
    objective: msg('memory:numberRecall.levels.6'),
    challengeCount: 5,
    variants: [{ kind: 'two-numbers', groups: [2, 2] }],
    timing: look(8, 750),
  },
  {
    objective: msg('memory:numberRecall.levels.7'),
    challengeCount: 5,
    variants: [{ kind: 'which-group', groups: [3, 3, 3] }],
    timing: look(9, 700),
  },
  {
    objective: msg('memory:numberRecall.levels.8'),
    challengeCount: 5,
    variants: [
      { kind: 'type-back', groups: [3, 3, 3] },
      { kind: 'two-numbers', groups: [2, 3] },
    ],
    timing: look(10, 650),
  },
  {
    objective: msg('memory:numberRecall.levels.9'),
    challengeCount: 4,
    variants: [{ kind: 'two-numbers', groups: [3, 3] }],
    timing: look(12, 600),
  },
  {
    objective: msg('memory:numberRecall.levels.10'),
    challengeCount: 4,
    variants: [
      { kind: 'which-group', groups: [3, 3, 3, 3] },
      { kind: 'two-numbers', groups: [3, 3] },
    ],
    timing: look(12, 550),
  },
]);
