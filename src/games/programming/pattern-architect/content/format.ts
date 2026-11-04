import { msg, type Message } from '@/domain/shared';
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
export const describeCell = (cell: GridCell): Message =>
  msg(`programming:patternArchitect.cell.${cell.shape}`, { count: cell.count });

/** Reads an option label such as `▲▲▲` back as words (`3 triangles`); undefined for other labels. */
export function describeLabel(label: string): Message | undefined {
  const entry = Object.entries(SHAPE_GLYPHS).find(([, glyph]) => label.startsWith(glyph));
  if (!entry) return undefined;
  const [shape, glyph] = entry as [Shape, string];
  const count = label.length / glyph.length;
  return Number.isInteger(count) && glyph.repeat(count) === label
    ? describeCell({ shape, count })
    : undefined;
}
