import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { ConditionalProfile } from './types';

/**
 * Starts with one comparison per branch over one input, then adds a second input, `and` / `or`,
 * `not` and a true/false flag, then nested ifs, reverse questions (which input gives this output?)
 * and finally short-circuit evaluation, where the order inside a condition prevents an error.
 */
export const CONDITIONAL_LEVELS = defineLevels<ConditionalProfile>([
  {
    objective: msg('programming:conditionalLogic.levels.1'),
    challengeCount: 5,
    timing: untimed(25_000),
    kinds: { branch: 1 },
    outcomes: 3,
    numberInputs: 1,
    parts: ['compare'],
  },
  {
    objective: msg('programming:conditionalLogic.levels.2'),
    challengeCount: 6,
    timing: untimed(30_000),
    kinds: { branch: 1 },
    outcomes: 4,
    numberInputs: 2,
    parts: ['compare'],
  },
  {
    objective: msg('programming:conditionalLogic.levels.3'),
    challengeCount: 6,
    timing: untimed(35_000),
    kinds: { branch: 2, 'find-input': 1 },
    outcomes: 4,
    numberInputs: 2,
    parts: ['compare', 'and', 'or'],
  },
  {
    objective: msg('programming:conditionalLogic.levels.4'),
    challengeCount: 6,
    timing: untimed(40_000),
    kinds: { branch: 2, 'find-input': 1 },
    outcomes: 4,
    numberInputs: 2,
    parts: ['compare', 'and', 'or', 'not', 'flag'],
  },
  {
    objective: msg('programming:conditionalLogic.levels.5'),
    challengeCount: 6,
    timing: untimed(45_000),
    kinds: { branch: 1, nested: 2, 'find-input': 1 },
    outcomes: 4,
    numberInputs: 2,
    parts: ['compare', 'and', 'or', 'not', 'flag'],
  },
  {
    objective: msg('programming:conditionalLogic.levels.6'),
    challengeCount: 6,
    timing: untimed(50_000),
    kinds: { branch: 1, nested: 1, 'find-input': 2 },
    outcomes: 4,
    numberInputs: 2,
    parts: ['compare', 'and', 'or', 'not', 'flag', 'mixed'],
  },
  {
    objective: msg('programming:conditionalLogic.levels.7'),
    challengeCount: 7,
    timing: untimed(60_000),
    kinds: { branch: 1, nested: 2, 'find-input': 2 },
    outcomes: 5,
    numberInputs: 2,
    parts: ['compare', 'and', 'or', 'not', 'flag', 'mixed'],
  },
  {
    objective: msg('programming:conditionalLogic.levels.8'),
    challengeCount: 7,
    timing: untimed(60_000),
    kinds: { branch: 1, nested: 1, 'find-input': 1, 'short-circuit': 2 },
    outcomes: 5,
    numberInputs: 2,
    parts: ['compare', 'and', 'or', 'not', 'flag', 'mixed'],
  },
  {
    objective: msg('programming:conditionalLogic.levels.9'),
    challengeCount: 7,
    timing: untimed(70_000),
    kinds: { nested: 1, 'find-input': 1, 'short-circuit': 3 },
    outcomes: 5,
    numberInputs: 2,
    parts: ['compare', 'and', 'or', 'not', 'flag', 'mixed'],
  },
  {
    objective: msg('programming:conditionalLogic.levels.10'),
    challengeCount: 8,
    timing: untimed(80_000),
    kinds: { nested: 2, 'find-input': 2, 'short-circuit': 3 },
    outcomes: 5,
    numberInputs: 2,
    parts: ['compare', 'and', 'or', 'not', 'flag', 'mixed'],
  },
]);
