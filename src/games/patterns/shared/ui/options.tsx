import type { ChoiceOption } from '@/domain/challenge';
import { parseFigure } from '../content/figures';
import { describeGrid, parseGrid } from '../content/tiles';
import { FigureFace } from './FigureFace';
import { TileGridFigure } from './TileGridFigure';

/**
 * Visual faces for option labels written by the shared codecs: tile grids ("■· / ·●") and
 * figures ("2 blue arrows pointing up"). The label stays the accessible name.
 */
export function renderPatternOption(option: ChoiceOption) {
  const grid = parseGrid(option.label);
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
  const figure = parseFigure(option.label);
  if (figure !== null) return <FigureFace figure={figure} label={false} />;
  return undefined;
}

/** Spoken name for tile-grid labels; figure labels already read as words. */
export function describePatternOption(label: string): string | undefined {
  const grid = parseGrid(label);
  return grid === null ? undefined : describeGrid(grid);
}
