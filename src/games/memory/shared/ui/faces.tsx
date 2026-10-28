import type { ChoiceOption } from '@/domain/challenge';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import { Glyph, ObjectFace } from '@/games/kit/ui';
import { objectByName } from '../content';

const isColor = (value: string): value is ColorName =>
  (COLORS as readonly string[]).includes(value);
const isShape = (value: string): value is ShapeKind =>
  (SHAPES as readonly string[]).includes(value);

/**
 * Visual face for option labels that name an everyday object ("apple"), a colour ("red") or a
 * glyph ("red star"). The label stays visible as text, so colour is never the only cue.
 */
export function renderNamedOption(option: ChoiceOption) {
  const { label } = option;
  const item = objectByName(label);
  if (item) {
    return (
      <span className="inline-flex items-center gap-2">
        <ObjectFace item={item} className="text-2xl" />
        <span aria-hidden="true">{label}</span>
      </span>
    );
  }
  const [first = '', second] = label.split(' ');
  if (isColor(first) && second === undefined) {
    return (
      <span className="inline-flex items-center gap-2">
        <Glyph glyph={{ shape: 'circle', color: first }} decorative className="h-6 w-6" />
        <span aria-hidden="true">{label}</span>
      </span>
    );
  }
  if (isColor(first) && second !== undefined && isShape(second)) {
    return (
      <span className="inline-flex items-center gap-2">
        <Glyph glyph={{ shape: second, color: first }} decorative className="h-7 w-7" />
        <span aria-hidden="true">{label}</span>
      </span>
    );
  }
  return undefined;
}
