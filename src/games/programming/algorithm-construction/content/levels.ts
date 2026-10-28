import { defineLevels, untimed } from '@/games/kit/content';
import type { ConstructionProfile } from './types';

/**
 * Three straight-line blocks first, then more blocks and variables, then loop blocks (where
 * "before or after the loop" changes the result), then a spare block that must be recognised as
 * unnecessary, and finally two loops plus a spare.
 */
export const CONSTRUCTION_LEVELS = defineLevels<ConstructionProfile>([
  {
    objective: 'Three blocks: set a value, change it, print it.',
    challengeCount: 5,
    timing: untimed(30_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 3,
    loops: 0,
    variableCount: 2,
  },
  {
    objective: 'Four blocks: each line needs a value set by an earlier one.',
    challengeCount: 5,
    timing: untimed(40_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 4,
    loops: 0,
    variableCount: 2,
  },
  {
    objective: 'Three variables: find which block can only come after which.',
    challengeCount: 6,
    timing: untimed(50_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 4,
    loops: 0,
    variableCount: 3,
  },
  {
    objective: 'A loop block: what happens before the loop changes what it produces.',
    challengeCount: 6,
    timing: untimed(55_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 4,
    loops: 1,
    variableCount: 2,
  },
  {
    objective: 'Five blocks around a loop.',
    challengeCount: 6,
    timing: untimed(65_000),
    kinds: { 'order-blocks': 1 },
    blockCount: 5,
    loops: 1,
    variableCount: 2,
  },
  {
    objective: 'A spare block: one block is not needed — put it last.',
    challengeCount: 6,
    timing: untimed(70_000),
    kinds: { 'order-blocks': 1, 'spare-block': 2 },
    blockCount: 5,
    loops: 1,
    variableCount: 2,
  },
  {
    objective: 'Spare blocks among three variables.',
    challengeCount: 7,
    timing: untimed(75_000),
    kinds: { 'order-blocks': 1, 'spare-block': 2 },
    blockCount: 5,
    loops: 1,
    variableCount: 3,
  },
  {
    objective: 'Two loops: their order matters.',
    challengeCount: 7,
    timing: untimed(85_000),
    kinds: { 'order-blocks': 2, 'spare-block': 1 },
    blockCount: 5,
    loops: 2,
    variableCount: 3,
  },
  {
    objective: 'Two loops and a spare block.',
    challengeCount: 7,
    timing: untimed(95_000),
    kinds: { 'order-blocks': 1, 'spare-block': 2 },
    blockCount: 5,
    loops: 2,
    variableCount: 3,
  },
  {
    objective: 'Always a spare: two loops, three variables, one block too many.',
    challengeCount: 8,
    timing: untimed(110_000),
    kinds: { 'spare-block': 1 },
    blockCount: 5,
    loops: 2,
    variableCount: 3,
  },
]);
