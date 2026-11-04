import type { ChoiceOption } from '@/domain/challenge';
import { isMessage, isTextList, type Text } from '@/domain/shared';
import {
  COLORS,
  SHAPES,
  type ColorName,
  type Glyph as GlyphSpec,
  type ShapeKind,
} from '@/games/kit/content';
import { Glyph } from '@/games/kit/ui';
import { TextFace } from './TextFace';

/** The glyph behind a `kit:glyph.<shape>` label message (with its colour value), or null. */
const asGlyph = (text: Text): GlyphSpec | null => {
  if (!isMessage(text) || !text.key.startsWith('kit:glyph.')) return null;
  const shape = text.key.slice('kit:glyph.'.length);
  const color = text.values?.['color'];
  return (COLORS as readonly unknown[]).includes(color) &&
    (SHAPES as readonly string[]).includes(shape)
    ? { color: color as ColorName, shape: shape as ShapeKind }
    : null;
};

/** Candidates drawn like the sequence: glyph rows for shapes, spaced monospace otherwise. */
export function renderSequenceOption({ label }: ChoiceOption) {
  const glyphs = isTextList(label) ? label.list.map(asGlyph) : [];
  if (glyphs.length > 1 && glyphs.every((g) => g !== null)) {
    return (
      <span className="flex flex-wrap gap-1">
        {glyphs.map((g, i) => (
          <Glyph key={i} glyph={g} decorative className="h-7 w-7" />
        ))}
      </span>
    );
  }
  return <TextFace label={label} />;
}
