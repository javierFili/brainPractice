import { joinText, type Message, type Text } from '@/domain/shared';
import { cellLabelAt } from '@/games/kit/content';

/** "row 2, column 3" for a 0-based index in a grid with `columns` columns. */
export const cellName = (index: number, columns: number): Message => cellLabelAt(index, columns);

/** Count of elements satisfying `test`. */
export const countWhere = <T>(items: readonly T[], test: (item: T) => boolean): number =>
  items.reduce((n, item) => n + (test(item) ? 1 : 0), 0);

/** Indices of the elements satisfying `test`, ascending. */
export const indicesWhere = <T>(items: readonly T[], test: (item: T, index: number) => boolean) =>
  items.flatMap((item, i) => (test(item, i) ? [i] : []));

/** A natural list in the reader's language ("a, b and c"). */
export const listWords = (words: readonly Text[]): Text => joinText(words);
