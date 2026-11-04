import type { ChoiceOption } from '@/domain/challenge';
import { isMessage } from '@/domain/shared';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import { Glyph, ObjectFace } from '@/games/kit/ui';
import { objectById } from '../content';
import { NamedFace } from './NamedFace';

const isColor = (value: unknown): value is ColorName =>
  (COLORS as readonly unknown[]).includes(value);
const isShape = (value: unknown): value is ShapeKind =>
  (SHAPES as readonly unknown[]).includes(value);

const OBJECT_KEY = 'kit:objects.';
const COLOR_KEY = 'kit:color.';
const GLYPH_KEY = 'kit:glyph.';

/** Picture for a label message that names an object, a colour or a coloured shape. */
function pictureOf(option: ChoiceOption) {
  const { label } = option;
  if (!isMessage(label)) return undefined;
  const { key, values } = label;
  if (key.startsWith(OBJECT_KEY)) {
    return <ObjectFace item={objectById(key.slice(OBJECT_KEY.length))} className="text-2xl" />;
  }
  if (key.startsWith(COLOR_KEY)) {
    const color = key.slice(COLOR_KEY.length);
    if (isColor(color))
      return <Glyph glyph={{ shape: 'circle', color }} decorative className="h-6 w-6" />;
  }
  if (key.startsWith(GLYPH_KEY)) {
    const shape = key.slice(GLYPH_KEY.length);
    const color = values?.['color'];
    if (isShape(shape) && isColor(color))
      return <Glyph glyph={{ shape, color }} decorative className="h-7 w-7" />;
  }
  return undefined;
}

/**
 * Visual face for option labels that name an everyday object ("apple"), a colour ("red") or a
 * glyph ("red star"). The label stays visible as text, so colour is never the only cue.
 */
export function renderNamedOption(option: ChoiceOption) {
  const picture = pictureOf(option);
  return picture === undefined ? undefined : <NamedFace option={option} picture={picture} />;
}
