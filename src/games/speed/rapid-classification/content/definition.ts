import type { GameDefinition } from '@/domain/game';
import { chance, pick, randomInt } from '@/domain/random';
import { gameIdOf, msg, type Message, type Text } from '@/domain/shared';
import { OBJECTS, type EverydayObject, type ObjectCategory } from '@/games/kit/content';
import { fixedChoice, SPEED_SCORING } from '@/games/speed/shared/content';
import { RAPID_CLASSIFICATION_LEVELS } from './levels';
import type { ClassRule, RapidClassificationChallenge, RapidClassificationProfile } from './types';

/** Objects that could reasonably belong to two groups (or read oddly as a word) are never shown. */
export const AMBIGUOUS_OBJECTS: ReadonlySet<string> = new Set([
  'mushroom',
  'fish',
  'honey',
  'glasses',
  'egg',
  'milk',
]);

export const CLASSIFIABLE: readonly EverydayObject[] = OBJECTS.filter(
  (item) => !AMBIGUOUS_OBJECTS.has(item.name),
);

export const LETTER_OPTIONS = ['A–M', 'N–Z'] as const;

/**
 * Objects whose name falls in the same half of the alphabet (A–M or N–Z) in every supported
 * language (en, es, it, fr, de; accents ignored). The first-letter rule only uses these, so its
 * answer never changes when the player switches language mid-trial (checked against the locale
 * files by the tests). Turtle (N–Z) is in every switch level's groups.
 */
export const LETTER_SAFE_OBJECTS: ReadonlySet<string> = new Set([
  'cherries',
  'cat',
  'turtle',
  'elephant',
  'giraffe',
  'bee',
  'bus',
  'airplane',
  'train',
  'hammer',
  'magnet',
  'cap',
  'gloves',
  'moon',
  'cactus',
  'pizza',
  'cookie',
]);

export const categoryLabel = (category: ObjectCategory): Message =>
  msg(`speed:rapidClassification.groups.${category}`);

/** 0 for A–M, 1 for N–Z. */
export const letterHalf = (name: string): 0 | 1 => (name.toLowerCase().charAt(0) <= 'm' ? 0 : 1);

export const RAPID_CLASSIFICATION_ID = gameIdOf('rapid-classification');

const promptOf = (rule: ClassRule) => msg(`speed:rapidClassification.prompt.${rule}`);

export const rapidClassificationGame: GameDefinition<
  RapidClassificationChallenge,
  RapidClassificationProfile
> = {
  id: RAPID_CLASSIFICATION_ID,
  name: msg('speed:rapidClassification.name'),
  tagline: msg('speed:rapidClassification.tagline'),
  description: msg('speed:rapidClassification.description'),
  area: 'speed',
  skills: ['processing-speed', 'cognitive-flexibility', 'selective-attention'],
  meta: {
    category: 'speed',
    audiences: ['kids', 'teens', 'adults', 'seniors'],
    interaction: 'choice',
    estimatedMinutes: 2,
    keyboard: 'full',
    relaxedFriendly: true,
    measures: ['accuracy', 'response-time'],
    scoringSummary: msg('speed:rapidClassification.scoringSummary'),
    feedback: 'brief',
  },
  instructions: [
    msg('speed:rapidClassification.instructions.object'),
    msg('speed:rapidClassification.instructions.groups'),
    msg('speed:rapidClassification.instructions.words'),
    msg('speed:rapidClassification.instructions.rule'),
  ],
  simpleInstructions: msg('speed:rapidClassification.simpleInstructions'),
  levels: RAPID_CLASSIFICATION_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    const rule: ClassRule =
      profile.kind === 'switch' && chance(random, profile.letterShare) ? 'letter' : 'category';
    const pool = CLASSIFIABLE.filter((item) => profile.categories.includes(item.category));
    let item: EverydayObject;
    let labels: readonly Text[];
    let correct: number;
    if (rule === 'category') {
      labels = profile.categories.map(categoryLabel);
      correct = randomInt(random, 0, labels.length - 1);
      const category = profile.categories[correct] as ObjectCategory;
      item = pick(
        random,
        pool.filter((o) => o.category === category),
      );
    } else {
      labels = LETTER_OPTIONS;
      correct = randomInt(random, 0, 1);
      item = pick(
        random,
        pool.filter((o) => LETTER_SAFE_OBJECTS.has(o.id) && letterHalf(o.name) === correct),
      );
    }
    const answer = labels[correct] as Text;
    return {
      ...identity,
      prompt: promptOf(rule),
      content: { kind: profile.kind, rule, item, showPicture: profile.showPicture },
      response: fixedChoice(labels, correct),
      explanation:
        rule === 'category'
          ? msg('speed:rapidClassification.explanation.category', {
              item: item.label,
              group: answer,
            })
          : msg('speed:rapidClassification.explanation.letter', {
              item: item.label,
              letter: msg(`speed:rapidClassification.initials.${item.id}`),
              range: answer,
            }),
      skills:
        profile.kind === 'switch'
          ? ['processing-speed', 'cognitive-flexibility']
          : ['processing-speed', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
