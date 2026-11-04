import { msg, type Message, type TextValue } from '@/domain/shared';
import type { CategoryId } from './types';

/**
 * Each category's values are stable English ids; what people read comes from the `logic` namespace
 * (`logicalDeduction.values.<category>.<id>`). Sentences about a value are whole templates per
 * category, and each language picks the article, case or partitive the value needs inside them
 * (`forms.<category>.<id>.<form>`), so no word ever has to agree with a variable noun in code.
 */
export const CATEGORIES: Readonly<Record<CategoryId, { readonly values: readonly string[] }>> = {
  pet: { values: ['cat', 'dog', 'fish', 'bird', 'rabbit'] },
  colour: { values: ['red', 'blue', 'green', 'yellow', 'purple'] },
  drink: { values: ['tea', 'milk', 'juice', 'water', 'cocoa'] },
  hobby: { values: ['painting', 'chess', 'music', 'reading', 'dancing'] },
};

export const CATEGORY_IDS: readonly CategoryId[] = ['pet', 'colour', 'drink', 'hobby'];

const key = (path: string) => `logic:logicalDeduction.${path}`;

export const categoryTitle = (id: CategoryId): Message => msg(key(`titles.${id}`));

/** The bare name of a value: "cat", "red". */
export const valueLabel = (id: CategoryId, value: string): Message =>
  msg(key(`values.${id}.${value}`));

type Sentence = 'is' | 'isNot' | 'either' | 'askWho' | 'askWhat';

/** A sentence about one value (or two, for `either`) of a category. */
export const categorySentence = (
  id: CategoryId,
  sentence: Sentence,
  values: Readonly<Record<string, TextValue>>,
): Message => msg(key(`${sentence}.${id}`), values);

/** "The person with the cat", "The person who drinks tea": a subject described by its value. */
export const subjectBy = (id: CategoryId, value: string): Message =>
  msg(key(`subject.${id}`), { value });
