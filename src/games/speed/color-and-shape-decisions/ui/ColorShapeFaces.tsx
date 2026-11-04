import type { Text } from '@/domain/shared';
import { useText } from '@/i18n';
import type { ColorName, ShapeKind } from '@/games/kit/content';
import { Glyph } from '@/games/kit/ui';

const SWATCH: Record<ColorName, string> = {
  red: 'bg-glyph-red',
  orange: 'bg-glyph-orange',
  yellow: 'bg-glyph-yellow',
  green: 'bg-glyph-green',
  blue: 'bg-glyph-blue',
  purple: 'bg-glyph-purple',
};

export function PairFace({
  label,
  color,
  shape,
}: {
  label: Text;
  color: ColorName;
  shape: ShapeKind;
}) {
  const tx = useText();
  return (
    <span className="flex items-center gap-2">
      <Glyph glyph={{ color, shape }} decorative className="h-6 w-6" />
      {tx(label)}
    </span>
  );
}

export function ColorFace({ label, color }: { label: Text; color: ColorName }) {
  const tx = useText();
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className={`h-4 w-4 rounded-full ${SWATCH[color]}`} />
      {tx(label)}
    </span>
  );
}
