import type { GameDefinition } from '@/domain/game';
import { chance, pick, randomInt } from '@/domain/random';
import { gameIdOf } from '@/domain/shared';
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

export const categoryLabel = (category: ObjectCategory) =>
  category.charAt(0).toUpperCase() + category.slice(1);

/** 0 for A–M, 1 for N–Z. */
export const letterHalf = (name: string): 0 | 1 => (name.toLowerCase().charAt(0) <= 'm' ? 0 : 1);

export const RAPID_CLASSIFICATION_ID = gameIdOf('rapid-classification');

const promptOf = (rule: ClassRule) =>
  rule === 'category'
    ? 'Which group does it belong to?'
    : 'Does its name start with a letter from A–M or N–Z?';

export const rapidClassificationGame: GameDefinition<
  RapidClassificationChallenge,
  RapidClassificationProfile
> = {
  id: RAPID_CLASSIFICATION_ID,
  name: 'Rapid Classification',
  tagline: 'Fruit or animal? Decide fast.',
  description:
    'An everyday object appears: put it in its group as fast as you can. Later levels show only the word, add more groups and finally switch rules: a cue says whether to sort by group or by the first letter of the name.',
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
    scoringSummary:
      'Each object is right or wrong; accuracy is always reported. Correct answers earn extra points the faster they come, wrong answers cost points, and your response time per answer is shown. Relaxed mode removes the time limit.',
    feedback: 'brief',
  },
  instructions: [
    'An object appears. Choose its group with a click or the number keys.',
    'The groups stay in the same place for the whole session, so you can keep your fingers ready.',
    'From level 5 you see only the word: read it, then decide.',
    'From level 7 a cue says the rule: CATEGORY (its group) or FIRST LETTER (A–M or N–Z).',
  ],
  simpleInstructions: 'Say which group the picture belongs to, as fast as you can.',
  levels: RAPID_CLASSIFICATION_LEVELS,
  scoring: SPEED_SCORING,
  generate({ identity, profile, random }) {
    const rule: ClassRule =
      profile.kind === 'switch' && chance(random, profile.letterShare) ? 'letter' : 'category';
    const pool = CLASSIFIABLE.filter((item) => profile.categories.includes(item.category));
    let item: EverydayObject;
    let labels: readonly string[];
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
        pool.filter((o) => letterHalf(o.name) === correct),
      );
    }
    const answer = labels[correct] as string;
    return {
      ...identity,
      prompt: promptOf(rule),
      content: { kind: profile.kind, rule, item, showPicture: profile.showPicture },
      response: fixedChoice(labels, correct),
      explanation:
        rule === 'category'
          ? `“${item.name}” belongs to the group “${answer}”.`
          : `“${item.name}” starts with “${item.name.charAt(0).toUpperCase()}”, which is in ${answer}.`,
      skills:
        profile.kind === 'switch'
          ? ['processing-speed', 'cognitive-flexibility']
          : ['processing-speed', 'selective-attention'],
      timing: profile.timing,
    };
  },
};
