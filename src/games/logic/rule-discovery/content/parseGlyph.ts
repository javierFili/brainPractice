import { isMessage, type Text } from '@/domain/shared';
import { COLORS, SHAPES, type ColorName, type Glyph, type ShapeKind } from '@/games/kit/content';

/** A glyph option label (`kit:glyph.<shape>` with its colour) → glyph; numbers give null. */
export function parseGlyph(label: Text): Glyph | null {
  if (!isMessage(label) || !label.key.startsWith('kit:glyph.')) return null;
  const shape = label.key.slice('kit:glyph.'.length);
  const color = label.values?.['color'];
  return typeof color === 'string' &&
    (COLORS as readonly string[]).includes(color) &&
    (SHAPES as readonly string[]).includes(shape)
    ? { color: color as ColorName, shape: shape as ShapeKind }
    : null;
}
