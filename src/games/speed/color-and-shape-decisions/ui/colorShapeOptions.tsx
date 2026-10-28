import type { ChoiceOption } from '@/domain/challenge';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import { Glyph } from '@/games/kit/ui';

const SWATCH: Record<ColorName, string> = {
  red: 'bg-glyph-red',
  orange: 'bg-glyph-orange',
  yellow: 'bg-glyph-yellow',
  green: 'bg-glyph-green',
  blue: 'bg-glyph-blue',
  purple: 'bg-glyph-purple',
};

const isColor = (word: string): word is ColorName => (COLORS as readonly string[]).includes(word);
const isShape = (word: string): word is ShapeKind => (SHAPES as readonly string[]).includes(word);

/** Shared keys show the pair as a small glyph; colour keys get a swatch next to the word. */
export function renderColorShapeOption({ label }: ChoiceOption) {
  const [color, shape] = label.split(' / ');
  if (color !== undefined && shape !== undefined && isColor(color) && isShape(shape)) {
    return (
      <span className="flex items-center gap-2">
        <Glyph glyph={{ color, shape }} decorative className="h-6 w-6" />
        {label}
      </span>
    );
  }
  if (isColor(label)) {
    return (
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className={`h-4 w-4 rounded-full ${SWATCH[label]}`} />
        {label}
      </span>
    );
  }
  return undefined;
}
