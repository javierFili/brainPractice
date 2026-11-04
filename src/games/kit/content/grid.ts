import { msg, type Message } from '@/domain/shared';

/** "row 2, column 3" (1-based), for accessible names of grid cells. */
export const cellLabel = (row: number, column: number): Message =>
  msg('kit:cell.rowColumn', { row: row + 1, column: column + 1 });

/** The same, from a 0-based index in a grid `columns` wide. */
export const cellLabelAt = (index: number, columns: number): Message =>
  cellLabel(Math.floor(index / columns), index % columns);
