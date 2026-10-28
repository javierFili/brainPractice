import { defineLevels, untimed } from '@/games/kit/content';
import type { DeductionProfile } from './types';

/**
 * From 3 people and one list (kids) to 5 people with two lists, or 4 people with three lists.
 * Direct "is" clues disappear as levels rise, so every fact must be deduced from "not", "either"
 * and cross-list clues.
 */
export const LOGICAL_DEDUCTION_LEVELS = defineLevels<DeductionProfile>([
  {
    objective: 'Three people, one list, simple clues.',
    challengeCount: 4,
    timing: untimed(40_000),
    people: 3,
    categories: 1,
    clueTypes: { is: 1, 'is-not': 2 },
  },
  {
    objective: 'Three people, one list, “not” and “either” clues.',
    challengeCount: 4,
    timing: untimed(45_000),
    people: 3,
    categories: 1,
    clueTypes: { 'is-not': 3, either: 1 },
  },
  {
    objective: 'Four people and “either … or” clues.',
    challengeCount: 4,
    timing: untimed(70_000),
    people: 4,
    categories: 1,
    clueTypes: { 'is-not': 3, either: 2, is: 1 },
  },
  {
    objective: 'Match two lists for three people.',
    challengeCount: 4,
    timing: untimed(60_000),
    people: 3,
    categories: 2,
    clueTypes: { is: 1, 'is-not': 2, link: 2 },
  },
  {
    objective: 'Three lists for three people.',
    challengeCount: 4,
    timing: untimed(100_000),
    people: 3,
    categories: 3,
    clueTypes: { 'is-not': 2, link: 2, 'not-link': 1 },
  },
  {
    objective: 'Two lists for four people, linked clues.',
    challengeCount: 4,
    timing: untimed(90_000),
    people: 4,
    categories: 2,
    clueTypes: { is: 1, 'is-not': 2, link: 2, either: 1 },
  },
  {
    objective: 'Two lists for four people with no direct answers.',
    challengeCount: 4,
    timing: untimed(120_000),
    people: 4,
    categories: 2,
    clueTypes: { 'is-not': 2, link: 2, 'not-link': 1, either: 1 },
  },
  {
    objective: 'Three lists for four people.',
    challengeCount: 3,
    timing: untimed(150_000),
    people: 4,
    categories: 3,
    clueTypes: { is: 1, 'is-not': 2, link: 3, 'not-link': 1, either: 1 },
  },
  {
    objective: 'Five people and two lists.',
    challengeCount: 3,
    timing: untimed(180_000),
    people: 5,
    categories: 2,
    clueTypes: { is: 1, 'is-not': 2, link: 2, 'not-link': 1, either: 2 },
  },
  {
    objective: 'Five people, two lists, only indirect clues.',
    challengeCount: 3,
    timing: untimed(210_000),
    people: 5,
    categories: 2,
    clueTypes: { 'is-not': 2, link: 2, 'not-link': 2, either: 2 },
  },
]);
