import { msg } from '@/domain/shared';
import { defineLevels, timed } from '@/games/kit/content';
import type { RapidClassificationProfile } from './types';

/**
 * Two groups with pictures → four groups → names only (reading before deciding) → a cued rule
 * switch between group and first letter. Fruit and food are never offered together (an apple is
 * both), and nature/food are not used at all so every object has exactly one right group.
 */
export const RAPID_CLASSIFICATION_LEVELS = defineLevels<RapidClassificationProfile>([
  {
    objective: msg('speed:rapidClassification.levels.1'),
    kind: 'picture',
    categories: ['fruit', 'animal'],
    showPicture: true,
    letterShare: 0,
    challengeCount: 10,
    timing: timed(2000, 5000),
  },
  {
    objective: msg('speed:rapidClassification.levels.2'),
    kind: 'picture',
    categories: ['vehicle', 'clothing'],
    showPicture: true,
    letterShare: 0,
    challengeCount: 12,
    timing: timed(1800, 4500),
  },
  {
    objective: msg('speed:rapidClassification.levels.3'),
    kind: 'picture',
    categories: ['fruit', 'animal', 'vehicle'],
    showPicture: true,
    letterShare: 0,
    challengeCount: 12,
    timing: timed(1900, 4500),
  },
  {
    objective: msg('speed:rapidClassification.levels.4'),
    kind: 'picture',
    categories: ['animal', 'vehicle', 'tool', 'clothing'],
    showPicture: true,
    letterShare: 0,
    challengeCount: 14,
    timing: timed(2000, 4200),
  },
  {
    objective: msg('speed:rapidClassification.levels.5'),
    kind: 'word',
    categories: ['fruit', 'tool'],
    showPicture: false,
    letterShare: 0,
    challengeCount: 14,
    timing: timed(1800, 4000),
  },
  {
    objective: msg('speed:rapidClassification.levels.6'),
    kind: 'word',
    categories: ['fruit', 'animal', 'tool', 'clothing'],
    showPicture: false,
    letterShare: 0,
    challengeCount: 14,
    timing: timed(2000, 3800),
  },
  {
    objective: msg('speed:rapidClassification.levels.7'),
    kind: 'switch',
    categories: ['fruit', 'animal'],
    showPicture: true,
    letterShare: 0.25,
    challengeCount: 14,
    timing: timed(2000, 3800),
  },
  {
    objective: msg('speed:rapidClassification.levels.8'),
    kind: 'switch',
    categories: ['animal', 'vehicle', 'tool'],
    showPicture: true,
    letterShare: 0.4,
    challengeCount: 16,
    timing: timed(2000, 3600),
  },
  {
    objective: msg('speed:rapidClassification.levels.9'),
    kind: 'switch',
    categories: ['fruit', 'animal', 'vehicle'],
    showPicture: false,
    letterShare: 0.5,
    challengeCount: 16,
    timing: timed(2000, 3400),
  },
  {
    objective: msg('speed:rapidClassification.levels.10'),
    kind: 'switch',
    categories: ['animal', 'vehicle', 'tool', 'clothing'],
    showPicture: false,
    letterShare: 0.5,
    challengeCount: 18,
    timing: timed(2000, 3200),
  },
]);
