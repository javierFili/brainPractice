import type { ResponseOf } from '@/domain/challenge';
import { shuffle, type RandomGenerator } from '@/domain/random';
import { OBJECTS, type EverydayObject } from '@/games/kit/content';

/** Spoken name of a grid cell, numbered row by row from 0. */
export const cellName = (index: number, columns: number) =>
  `row ${Math.floor(index / columns) + 1}, column ${(index % columns) + 1}`;

const OBJECT_BY_ID = new Map(OBJECTS.map((item) => [item.id, item]));
const OBJECT_BY_NAME = new Map(OBJECTS.map((item) => [item.name, item]));

export function objectById(id: string): EverydayObject {
  const item = OBJECT_BY_ID.get(id);
  if (!item) throw new Error(`Unknown object ${id}`);
  return item;
}

export const objectByName = (name: string): EverydayObject | undefined => OBJECT_BY_NAME.get(name);

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];

/** `1` → "first"; falls back to "9th" beyond the table. */
export const ordinal = (position: number) => ORDINALS[position - 1] ?? `${position}th`;

/**
 * Ordering response whose starting arrangement is never already the solution (submitting the
 * untouched list must not score).
 */
export function orderingResponse(
  random: RandomGenerator,
  items: readonly { readonly id: string; readonly label: string }[],
): ResponseOf<'ordering'> {
  if (items.length < 2) throw new RangeError('ordering needs at least two items');
  const order = items.map((item) => item.id);
  let shown = shuffle(random, items);
  while (shown.every((item, i) => item.id === order[i])) shown = shuffle(random, items);
  return { format: 'ordering', question: { items: shown }, solution: { order } };
}
