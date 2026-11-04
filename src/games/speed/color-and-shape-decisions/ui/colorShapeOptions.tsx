import type { ChoiceOption } from '@/domain/challenge';
import { isMessage, isTextList, type Text } from '@/domain/shared';
import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import { ColorFace, PairFace } from './ColorShapeFaces';

/** The id behind a kit label message (`kit:color.red` → `red`), or undefined. */
const idOf = (text: Text | undefined, prefix: string): string | undefined =>
  isMessage(text) && text.key.startsWith(prefix) ? text.key.slice(prefix.length) : undefined;

const asColor = (text: Text | undefined): ColorName | undefined => {
  const id = idOf(text, 'kit:color.');
  return (COLORS as readonly (string | undefined)[]).includes(id) ? (id as ColorName) : undefined;
};

const asShape = (text: Text | undefined): ShapeKind | undefined => {
  const id = idOf(text, 'kit:shape.');
  return (SHAPES as readonly (string | undefined)[]).includes(id) ? (id as ShapeKind) : undefined;
};

/** Shared keys show the pair as a small glyph; colour keys get a swatch next to the word. */
export function renderColorShapeOption({ label }: ChoiceOption) {
  if (isTextList(label)) {
    const [first, second] = label.list;
    const color = asColor(first);
    const shape = asShape(second);
    if (color !== undefined && shape !== undefined)
      return <PairFace label={label} color={color} shape={shape} />;
    return undefined;
  }
  const color = asColor(label);
  return color === undefined ? undefined : <ColorFace label={label} color={color} />;
}
