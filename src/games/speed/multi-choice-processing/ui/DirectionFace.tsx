import type { Text } from '@/domain/shared';
import { useText } from '@/i18n';
import type { Direction } from '../content/types';
import { Arrow } from './FlankerView';

/** The arrow next to its word. */
export function DirectionFace({ direction, label }: { direction: Direction; label: Text }) {
  const tx = useText();
  return (
    <span className="flex items-center gap-2">
      <Arrow item={direction} className="h-6 w-6" />
      {tx(label)}
    </span>
  );
}
