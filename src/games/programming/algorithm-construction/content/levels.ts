import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { ConstructionProfile } from './types';

/**
 * Three straight-line blocks first, then more blocks and variables, then loop blocks (where
 * "before or after the loop" changes the result), then a spare block that must be recognised as
 * unnecessary, and finally two loops plus a spare.
 */
export const CONSTRUCTION_LEVELS = defineLevels<ConstructionProfile>([
  {
    objective: msg('programming:algorithmConstruction.levels.1'),
    challengeCount: 5,
    timing: untimed(30_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 3,
    loops: 0,
    variableCount: 2,
  },
  {
    objective: msg('programming:algorithmConstruction.levels.2'),
    challengeCount: 5,
    timing: untimed(40_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 4,
    loops: 0,
    variableCount: 2,
  },
  {
    objective: msg('programming:algorithmConstruction.levels.3'),
    challengeCount: 6,
    timing: untimed(50_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 4,
    loops: 0,
    variableCount: 3,
  },
  {
    objective: msg('programming:algorithmConstruction.levels.4'),
    challengeCount: 6,
    timing: untimed(55_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 4,
    loops: 1,
    variableCount: 2,
  },
  {
    objective: msg('programming:algorithmConstruction.levels.5'),
    challengeCount: 6,
    timing: untimed(65_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 5,
    loops: 1,
    variableCount: 2,
  },
  {
    objective: msg('programming:algorithmConstruction.levels.6'),
    challengeCount: 6,
    timing: untimed(70_000),
    kinds: { 'order-blocks': 1, 'spare-block': 2 },
    blockCount: 5,
    loops: 1,
    variableCount: 2,
  },
  {
    objective: msg('programming:algorithmConstruction.levels.7'),
    challengeCount: 7,
    timing: untimed(75_000),
    kinds: { 'order-blocks': 1, 'spare-block': 2 },
    blockCount: 5,
    loops: 1,
    variableCount: 3,
  },
  {
    objective: msg('programming:algorithmConstruction.levels.8'),
    challengeCount: 7,
    timing: untimed(85_000),
    kinds: { 'order-blocks': 2, 'spare-block': 1 },
    blockCount: 5,
    loops: 2,
    variableCount: 3,
  },
  {
    objective: msg('programming:algorithmConstruction.levels.9'),
    challengeCount: 7,
    timing: untimed(95_000),
    kinds: { 'order-blocks': 1, 'spare-block': 2 },
    blockCount: 5,
    loops: 2,
    variableCount: 3,
  },
  {
    objective: msg('programming:algorithmConstruction.levels.10'),
    challengeCount: 8,
    timing: untimed(110_000),
    kinds: { 'spare-block': 1 },
    blockCount: 5,
    loops: 2,
    variableCount: 3,
  },
]);
