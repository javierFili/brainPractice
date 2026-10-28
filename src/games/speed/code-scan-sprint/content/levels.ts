import { defineLevels, timed } from '@/games/kit/content';
import type { CodeScanSprintProfile } from './types';

type Row = Omit<
  CodeScanSprintProfile,
  'level' | 'tier' | 'timing' | 'objective' | 'challengeCount'
>;

const row = (
  objective: string,
  params: Row,
  [targetMs, limitMs]: readonly [number, number],
  challengeCount: number,
) => ({ objective, ...params, challengeCount, timing: timed(targetMs, limitMs) });

/**
 * Short flat listings with plain "which line calls / uses" questions, then variables assigned
 * several times, conditions that compete with other uses of the same name, nested blocks and
 * longer listings. Target time grows with the listing (reading takes longer); the limit stays
 * tight relative to it.
 */
export const CODE_SCAN_SPRINT_LEVELS = defineLevels<CodeScanSprintProfile>([
  row(
    'Find the line that calls a routine, in 4 lines.',
    {
      kinds: { call: 1 },
      lineCount: 4,
      variables: 2,
      routines: 3,
      maxDepth: 0,
      minAssignments: 1,
      maxNumber: 9,
    },
    [2500, 8000],
    10,
  ),
  row(
    'Calls or numbers, in 5 lines.',
    {
      kinds: { call: 1, number: 1 },
      lineCount: 5,
      variables: 2,
      routines: 3,
      maxDepth: 0,
      minAssignments: 1,
      maxNumber: 9,
    },
    [2800, 8000],
    10,
  ),
  row(
    'Blocks appear: lines inside if and repeat.',
    {
      kinds: { call: 1, number: 1 },
      lineCount: 6,
      variables: 3,
      routines: 3,
      maxDepth: 1,
      minAssignments: 1,
      maxNumber: 12,
    },
    [3000, 8500],
    12,
  ),
  row(
    'Where does a variable first get a value?',
    {
      kinds: { call: 1, number: 1, 'first-assign': 2 },
      lineCount: 6,
      variables: 3,
      routines: 4,
      maxDepth: 1,
      minAssignments: 1,
      maxNumber: 12,
    },
    [3200, 8500],
    12,
  ),
  row(
    'Conditions: which line checks a variable?',
    {
      kinds: { number: 1, 'first-assign': 1, condition: 2 },
      lineCount: 7,
      variables: 3,
      routines: 4,
      maxDepth: 1,
      minAssignments: 1,
      maxNumber: 15,
    },
    [3400, 9000],
    12,
  ),
  row(
    'Variables assigned twice: first or last time?',
    {
      kinds: { 'first-assign': 1, 'last-assign': 1, condition: 1 },
      lineCount: 8,
      variables: 3,
      routines: 4,
      maxDepth: 1,
      minAssignments: 2,
      maxNumber: 15,
    },
    [3600, 9000],
    14,
  ),
  row(
    'Nested blocks, every kind of question.',
    {
      kinds: { call: 1, number: 1, 'first-assign': 1, 'last-assign': 1, condition: 1 },
      lineCount: 9,
      variables: 3,
      routines: 4,
      maxDepth: 2,
      minAssignments: 2,
      maxNumber: 20,
    },
    [3800, 9500],
    14,
  ),
  row(
    'Four variables, 10 lines.',
    {
      kinds: { call: 1, number: 1, 'first-assign': 1, 'last-assign': 1, condition: 1 },
      lineCount: 10,
      variables: 4,
      routines: 5,
      maxDepth: 2,
      minAssignments: 2,
      maxNumber: 20,
    },
    [4000, 9500],
    14,
  ),
  row(
    'Mostly assignment and condition questions, 11 lines.',
    {
      kinds: { number: 1, 'first-assign': 2, 'last-assign': 2, condition: 2 },
      lineCount: 11,
      variables: 4,
      routines: 5,
      maxDepth: 2,
      minAssignments: 2,
      maxNumber: 20,
    },
    [4200, 10000],
    16,
  ),
  row(
    'Master: 12 nested lines, every kind of question.',
    {
      kinds: { call: 1, number: 1, 'first-assign': 2, 'last-assign': 2, condition: 2 },
      lineCount: 12,
      variables: 4,
      routines: 5,
      maxDepth: 2,
      minAssignments: 2,
      maxNumber: 20,
    },
    [4400, 10000],
    16,
  ),
]);
