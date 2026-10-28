/** Short, distinct, easy-to-read first names (no two share a first letter). */
export const PEOPLE = [
  'Ana',
  'Ben',
  'Cai',
  'Dev',
  'Eva',
  'Finn',
  'Gia',
  'Hugo',
  'Iris',
  'Jon',
  'Kim',
  'Leo',
  'Maya',
  'Nico',
  'Omar',
  'Pia',
  'Rosa',
  'Sam',
  'Tess',
  'Uma',
] as const;

/** "a", "a and b", "a, b and c". */
export function listJoin(items: readonly string[], conjunction = 'and'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items.at(-1) as string}`;
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];

/** 1 → "first". */
export const ordinal = (position: number): string => ORDINALS[position - 1] ?? `${position}th`;

export const capitalize = (text: string): string =>
  text.length === 0 ? text : `${(text[0] as string).toUpperCase()}${text.slice(1)}`;

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;
