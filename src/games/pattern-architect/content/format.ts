import type { GridCell, Shape } from './types';

/** Text rendering of content, shared by option labels, explanations and the UI. */

export const SHAPE_GLYPHS: Readonly<Record<Shape, string>> = {
  circle: '●',
  triangle: '▲',
  square: '■',
  diamond: '◆',
  star: '★',
};

/** `▲▲▲`: the shape repeated `count` times. */
export const cellLabel = (cell: GridCell) => SHAPE_GLYPHS[cell.shape].repeat(cell.count);

/** `3 triangles`: the same cell in words, for screen readers and explanations. */
export const describeCell = (cell: GridCell) =>
  `${cell.count} ${cell.shape}${cell.count === 1 ? '' : 's'}`;
