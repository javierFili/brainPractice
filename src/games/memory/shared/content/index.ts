import { singleChoice, type ResponseOf } from '@/domain/challenge';
import { shuffle, type RandomGenerator } from '@/domain/random';
import { msg, textId, type Message, type Text } from '@/domain/shared';
import { cellLabelAt, OBJECTS, type EverydayObject } from '@/games/kit/content';

/** Spoken name of a grid cell, numbered row by row from 0 ("row 2, column 3"). */
export const cellName = (index: number, columns: number): Message => cellLabelAt(index, columns);

const OBJECT_BY_ID = new Map(OBJECTS.map((item) => [item.id, item]));
const OBJECT_BY_NAME = new Map(OBJECTS.map((item) => [item.name, item]));

export function objectById(id: string): EverydayObject {
  const item = OBJECT_BY_ID.get(id);
  if (!item) throw new Error(`Unknown object ${id}`);
  return item;
}

export const objectByName = (name: string): EverydayObject | undefined => OBJECT_BY_NAME.get(name);

/** Highest position `ordinal` has a translation for. */
export const MAX_ORDINAL = 10;

/**
 * `1` → "first", as it reads after "came" ("Which object came first?"). Each language words it so
 * it fits that sentence whatever the noun's gender ("en primer lugar", "als Erstes").
 */
export function ordinal(position: number): Message {
  if (!Number.isInteger(position) || position < 1 || position > MAX_ORDINAL)
    throw new RangeError(`No ordinal for ${position}`);
  return msg(`memory:shared.ordinal.${position}`);
}

/**
 * Single-choice response over translatable labels. Options are compared by identity (not by the
 * words in one language), and shuffled exactly as `singleChoice` would shuffle plain labels.
 */
export function textChoice(
  random: RandomGenerator,
  correct: Text,
  distractors: readonly Text[],
): ResponseOf<'single-choice'> {
  const byId = new Map([correct, ...distractors].map((label) => [textId(label), label]));
  const response = singleChoice(random, textId(correct), distractors.map(textId));
  return {
    ...response,
    question: {
      options: response.question.options.map((option) => ({
        id: option.id,
        label: byId.get(option.label as string) as Text,
      })),
    },
  };
}

/**
 * Ordering response whose starting arrangement is never already the solution (submitting the
 * untouched list must not score).
 */
export function orderingResponse(
  random: RandomGenerator,
  items: readonly { readonly id: string; readonly label: Text }[],
): ResponseOf<'ordering'> {
  if (items.length < 2) throw new RangeError('ordering needs at least two items');
  const order = items.map((item) => item.id);
  let shown = shuffle(random, items);
  while (shown.every((item, i) => item.id === order[i])) shown = shuffle(random, items);
  return { format: 'ordering', question: { items: shown }, solution: { order } };
}
