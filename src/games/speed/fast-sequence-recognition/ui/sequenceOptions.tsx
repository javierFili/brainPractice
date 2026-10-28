import type { ChoiceOption } from '@/domain/challenge';
import {
  COLORS,
  SHAPES,
  type ColorName,
  type Glyph as GlyphSpec,
  type ShapeKind,
} from '@/games/kit/content';
import { Glyph } from '@/games/kit/ui';
import { SHAPE_SEPARATOR } from '../content/definition';

const asGlyph = (name: string): GlyphSpec | null => {
  const [color, shape] = name.split(' ');
  return (COLORS as readonly string[]).includes(color ?? '') &&
    (SHAPES as readonly string[]).includes(shape ?? '')
    ? { color: color as ColorName, shape: shape as ShapeKind }
    : null;
};

/** Candidates drawn like the sequence: glyph rows for shapes, spaced monospace otherwise. */
export function renderSequenceOption({ label }: ChoiceOption) {
  const names = label.split(SHAPE_SEPARATOR);
  const glyphs = names.map(asGlyph);
  if (names.length > 1 && glyphs.every((g) => g !== null)) {
    return (
      <span className="flex flex-wrap gap-1">
        {glyphs.map((g, i) => (
          <Glyph key={i} glyph={g} decorative className="h-7 w-7" />
        ))}
      </span>
    );
  }
  return <span className="font-mono text-xl tracking-[0.3em] text-ink">{label}</span>;
}
