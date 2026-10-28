import { COLORS, SHAPES, type ColorName, type Glyph, type ShapeKind } from '@/games/kit/content';

/** "blue star" → glyph, for option faces; other labels (numbers) render as text. */
export function parseGlyph(label: string): Glyph | null {
  const [color, shape] = label.split(' ');
  return (COLORS as readonly string[]).includes(color ?? '') &&
    (SHAPES as readonly string[]).includes(shape ?? '')
    ? { color: color as ColorName, shape: shape as ShapeKind }
    : null;
}
