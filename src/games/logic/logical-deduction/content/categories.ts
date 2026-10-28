import type { CategoryId } from './types';

interface CategoryText {
  readonly id: CategoryId;
  readonly title: string;
  readonly values: readonly string[];
  readonly is: (v: string) => string;
  readonly isNot: (v: string) => string;
  readonly either: (a: string, b: string) => string;
  /** Describes a person by this value: "with the cat", "who likes red". */
  readonly who: (v: string) => string;
  readonly askWho: (v: string) => string;
  readonly askWhat: (person: string) => string;
}

export const CATEGORIES: Readonly<Record<CategoryId, CategoryText>> = {
  pet: {
    id: 'pet',
    title: 'Pets',
    values: ['cat', 'dog', 'fish', 'bird', 'rabbit'],
    is: (v) => `has the ${v}`,
    isNot: (v) => `does not have the ${v}`,
    either: (a, b) => `has either the ${a} or the ${b}`,
    who: (v) => `with the ${v}`,
    askWho: (v) => `Who has the ${v}?`,
    askWhat: (p) => `Which pet does ${p} have?`,
  },
  colour: {
    id: 'colour',
    title: 'Favourite colours',
    values: ['red', 'blue', 'green', 'yellow', 'purple'],
    is: (v) => `likes ${v} best`,
    isNot: (v) => `does not like ${v} best`,
    either: (a, b) => `likes either ${a} or ${b} best`,
    who: (v) => `who likes ${v} best`,
    askWho: (v) => `Who likes ${v} best?`,
    askWhat: (p) => `Which colour does ${p} like best?`,
  },
  drink: {
    id: 'drink',
    title: 'Drinks',
    values: ['tea', 'milk', 'juice', 'water', 'cocoa'],
    is: (v) => `drinks ${v}`,
    isNot: (v) => `does not drink ${v}`,
    either: (a, b) => `drinks either ${a} or ${b}`,
    who: (v) => `who drinks ${v}`,
    askWho: (v) => `Who drinks ${v}?`,
    askWhat: (p) => `What does ${p} drink?`,
  },
  hobby: {
    id: 'hobby',
    title: 'Hobbies',
    values: ['painting', 'chess', 'music', 'reading', 'dancing'],
    is: (v) => `enjoys ${v}`,
    isNot: (v) => `does not enjoy ${v}`,
    either: (a, b) => `enjoys either ${a} or ${b}`,
    who: (v) => `who enjoys ${v}`,
    askWho: (v) => `Who enjoys ${v}?`,
    askWhat: (p) => `Which hobby does ${p} enjoy?`,
  },
};

export const CATEGORY_IDS: readonly CategoryId[] = ['pet', 'colour', 'drink', 'hobby'];
