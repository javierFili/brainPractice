import type { ChoiceOption } from '@/domain/challenge';
import { isMessage, type Text } from '@/domain/shared';
import { DIRECTIONS, type Direction } from '../content/types';
import { DirectionFace } from './DirectionFace';

const PREFIX = 'speed:multiChoiceProcessing.directions.';

const asDirection = (label: Text): Direction | null => {
  if (!isMessage(label) || !label.key.startsWith(PREFIX)) return null;
  const d = label.key.slice(PREFIX.length);
  return (DIRECTIONS as readonly string[]).includes(d) ? (d as Direction) : null;
};

/** Answer buttons show the arrow next to its word. */
export function renderDirectionOption({ label }: ChoiceOption) {
  const direction = asDirection(label);
  return direction === null ? undefined : <DirectionFace direction={direction} label={label} />;
}
