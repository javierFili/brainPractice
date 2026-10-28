import { defineLevels, timed } from '@/games/kit/content';
import type { RapidClassificationProfile } from './types';

/**
 * Two groups with pictures → four groups → names only (reading before deciding) → a cued rule
 * switch between group and first letter. Fruit and food are never offered together (an apple is
 * both), and nature/food are not used at all so every object has exactly one right group.
 */
export const RAPID_CLASSIFICATION_LEVELS = defineLevels<RapidClassificationProfile>([
  {
    objective: 'Sort pictures into two groups: fruit or animal.',
    kind: 'picture',
    categories: ['fruit', 'animal'],
    showPicture: true,
    letterShare: 0,
    challengeCount: 10,
    timing: timed(2000, 5000),
  },
  {
    objective: 'Two new groups: vehicle or clothing.',
    kind: 'picture',
    categories: ['vehicle', 'clothing'],
    showPicture: true,
    letterShare: 0,
    challengeCount: 12,
    timing: timed(1800, 4500),
  },
  {
    objective: 'Three groups to choose from.',
    kind: 'picture',
    categories: ['fruit', 'animal', 'vehicle'],
    showPicture: true,
    letterShare: 0,
    challengeCount: 12,
    timing: timed(1900, 4500),
  },
  {
    objective: 'Four groups to choose from.',
    kind: 'picture',
    categories: ['animal', 'vehicle', 'tool', 'clothing'],
    showPicture: true,
    letterShare: 0,
    challengeCount: 14,
    timing: timed(2000, 4200),
  },
  {
    objective: 'Words only: read the name, then sort it (fruit or tool).',
    kind: 'word',
    categories: ['fruit', 'tool'],
    showPicture: false,
    letterShare: 0,
    challengeCount: 14,
    timing: timed(1800, 4000),
  },
  {
    objective: 'Words only, four groups.',
    kind: 'word',
    categories: ['fruit', 'animal', 'tool', 'clothing'],
    showPicture: false,
    letterShare: 0,
    challengeCount: 14,
    timing: timed(2000, 3800),
  },
  {
    objective: 'Follow the cue: sort by group, or by first letter (A–M or N–Z).',
    kind: 'switch',
    categories: ['fruit', 'animal'],
    showPicture: true,
    letterShare: 0.25,
    challengeCount: 14,
    timing: timed(2000, 3800),
  },
  {
    objective: 'More letter trials, three groups.',
    kind: 'switch',
    categories: ['animal', 'vehicle', 'tool'],
    showPicture: true,
    letterShare: 0.4,
    challengeCount: 16,
    timing: timed(2000, 3600),
  },
  {
    objective: 'Cued switching with words only.',
    kind: 'switch',
    categories: ['fruit', 'animal', 'vehicle'],
    showPicture: false,
    letterShare: 0.5,
    challengeCount: 16,
    timing: timed(2000, 3400),
  },
  {
    objective: 'Master: words only, four groups, rule changes at random.',
    kind: 'switch',
    categories: ['animal', 'vehicle', 'tool', 'clothing'],
    showPicture: false,
    letterShare: 0.5,
    challengeCount: 18,
    timing: timed(2000, 3200),
  },
]);
