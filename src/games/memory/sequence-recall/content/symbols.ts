import type { ChoiceOption } from '@/domain/challenge';
import type { Text } from '@/domain/shared';
import { COLORS, colorLabel, SHAPES, shapeLabel } from '@/games/kit/content';
import type { Palette } from './types';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const option = (prefix: string, value: string, label: Text = value): ChoiceOption => ({
  id: `${prefix}:${value}`,
  label,
});

/** All symbols of a palette. `mixed` combines colours and digits (labels stay unique). */
export function paletteSymbols(palette: Palette): ChoiceOption[] {
  switch (palette) {
    case 'colors':
      return COLORS.map((c) => option('c', c, colorLabel(c)));
    case 'digits':
      return DIGITS.map((d) => option('d', d));
    case 'shapes':
      return SHAPES.map((s) => option('s', s, shapeLabel(s)));
    case 'mixed':
      return [
        ...COLORS.slice(0, 4).map((c) => option('c', c, colorLabel(c))),
        ...DIGITS.map((d) => option('d', d)),
      ];
  }
}
