import { msg } from '@/domain/shared';
import { defineLevels, untimed } from '@/games/kit/content';
import type { AssociationProfile } from './types';

const look = (pairs: number, msPerPair: number) => untimed(9000, pairs * msPerPair + 1500);

/**
 * Pairs grow from 3 to 8. The pairings change kind (colours, then shapes with objects, then
 * words with numbers), associates become look-alikes (one object family, near-identical shapes,
 * numbers built from the same digits) and the cue direction is reversed, then mixed.
 */
export const ASSOCIATION_LEVELS = defineLevels<AssociationProfile>([
  {
    objective: msg('memory:associationMemory.levels.1'),
    challengeCount: 5,
    kinds: { 'object-color': 1 },
    pairs: 3,
    similar: false,
    reversedShare: 0,
    options: 3,
    timing: look(3, 2500),
  },
  {
    objective: msg('memory:associationMemory.levels.2'),
    challengeCount: 5,
    kinds: { 'object-color': 1 },
    pairs: 4,
    similar: false,
    reversedShare: 0,
    options: 4,
    timing: look(4, 2300),
  },
  {
    objective: msg('memory:associationMemory.levels.3'),
    challengeCount: 5,
    kinds: { 'glyph-object': 1 },
    pairs: 4,
    similar: false,
    reversedShare: 0,
    options: 4,
    timing: look(4, 2300),
  },
  {
    objective: msg('memory:associationMemory.levels.4'),
    challengeCount: 5,
    kinds: { 'word-number': 1 },
    pairs: 4,
    similar: false,
    reversedShare: 0,
    options: 4,
    timing: look(4, 2200),
  },
  {
    objective: msg('memory:associationMemory.levels.5'),
    challengeCount: 5,
    kinds: { 'object-color': 1 },
    pairs: 5,
    similar: true,
    reversedShare: 0,
    options: 4,
    timing: look(5, 2100),
  },
  {
    objective: msg('memory:associationMemory.levels.6'),
    challengeCount: 5,
    kinds: { 'word-number': 1 },
    pairs: 5,
    similar: false,
    reversedShare: 1,
    options: 4,
    timing: look(5, 2000),
  },
  {
    objective: msg('memory:associationMemory.levels.7'),
    challengeCount: 5,
    kinds: { 'glyph-object': 1 },
    pairs: 6,
    similar: true,
    reversedShare: 0.5,
    options: 4,
    timing: look(6, 2000),
  },
  {
    objective: msg('memory:associationMemory.levels.8'),
    challengeCount: 5,
    kinds: { 'word-number': 1 },
    pairs: 6,
    similar: true,
    reversedShare: 0.5,
    options: 4,
    timing: look(6, 1900),
  },
  {
    objective: msg('memory:associationMemory.levels.9'),
    challengeCount: 4,
    kinds: { 'glyph-object': 1, 'word-number': 1 },
    pairs: 7,
    similar: true,
    reversedShare: 0.5,
    options: 5,
    timing: look(7, 1800),
  },
  {
    objective: msg('memory:associationMemory.levels.10'),
    challengeCount: 4,
    kinds: { 'glyph-object': 1, 'word-number': 1 },
    pairs: 8,
    similar: true,
    reversedShare: 0.5,
    options: 5,
    timing: look(8, 1600),
  },
]);
