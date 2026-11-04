import type { ChoiceOption } from '@/domain/challenge';
import type { Text } from '@/domain/shared';
import { figureFromText } from '../content/figures';
import { describeGrid, parseGrid } from '../content/tiles';
import { FigureFace } from './FigureFace';
import { TileGridFigure } from './TileGridFigure';

/**
 * Visual faces for option labels written by the shared codecs: tile grids ("■· / ·●", literal
 * symbols in every language) and figures (`figureLabel` messages). The label stays the accessible name.
 */
export function renderPatternOption(option: ChoiceOption) {
  const grid = typeof option.label === 'string' ? parseGrid(option.label) : null;
  if (grid !== null) {
    const size = Math.max(grid.length, grid[0]?.length ?? 0);
    return (
      <TileGridFigure
        grid={grid}
        decorative
        className={size >= 5 ? 'w-24 sm:w-28' : size >= 4 ? 'w-20 sm:w-24' : 'w-16 sm:w-20'}
      />
    );
  }
  const figure = figureFromText(option.label);
  if (figure !== null) return <FigureFace figure={figure} label={false} />;
  return undefined;
}

/** Spoken name for tile-grid labels; figure labels already read as words. */
export function describePatternOption(label: string): Text | undefined {
  const grid = parseGrid(label);
  return grid === null ? undefined : describeGrid(grid);
}
