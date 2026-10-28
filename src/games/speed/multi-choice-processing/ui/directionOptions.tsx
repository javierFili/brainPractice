import type { ChoiceOption } from '@/domain/challenge';
import type { Direction } from '../content/types';
import { Arrow } from './FlankerView';

const asDirection = (label: string): Direction | null => {
  const d = label.toLowerCase();
  return d === 'left' || d === 'right' || d === 'up' || d === 'down' ? d : null;
};

/** Answer buttons show the arrow next to its word. */
export function renderDirectionOption({ label }: ChoiceOption) {
  const direction = asDirection(label);
  if (direction === null) return undefined;
  return (
    <span className="flex items-center gap-2">
      <Arrow item={direction} className="h-6 w-6" />
      {label}
    </span>
  );
}
