/** "row 2, column 3" for a 0-based index in a grid with `columns` columns. */
export const cellName = (index: number, columns: number): string =>
  `row ${Math.floor(index / columns) + 1}, column ${(index % columns) + 1}`;

/** Count of elements satisfying `test`. */
export const countWhere = <T>(items: readonly T[], test: (item: T) => boolean): number =>
  items.reduce((n, item) => n + (test(item) ? 1 : 0), 0);

/** Indices of the elements satisfying `test`, ascending. */
export const indicesWhere = <T>(items: readonly T[], test: (item: T, index: number) => boolean) =>
  items.flatMap((item, i) => (test(item, i) ? [i] : []));

/** Joins with commas and a final "and". */
export function listWords(words: readonly string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1) ?? ''}`;
}
