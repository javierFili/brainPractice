import { COLORS, SHAPES, type ColorName, type ShapeKind } from '@/games/kit/content';
import { Glyph } from '@/games/kit/ui';

const isColor = (value: string): value is ColorName =>
  (COLORS as readonly string[]).includes(value);
const isShape = (value: string): value is ShapeKind =>
  (SHAPES as readonly string[]).includes(value);

/** Colours are shown as circles, shapes in a neutral blue, digits as text. */
export function SymbolFace({ id, className = 'h-9 w-9' }: { id: string; className?: string }) {
  const [prefix, value = ''] = id.split(':');
  if (prefix === 'c' && isColor(value))
    return <Glyph glyph={{ shape: 'circle', color: value }} decorative className={className} />;
  if (prefix === 's' && isShape(value))
    return <Glyph glyph={{ shape: value, color: 'blue' }} decorative className={className} />;
  return <span className="font-mono text-2xl font-semibold">{value}</span>;
}
