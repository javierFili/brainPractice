import { glyphLabel } from '@/games/kit/content';
import { CellGrid, Glyph, type CellState } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import type { VisualSearchChallenge } from '../content/types';

/** The target as a reference, then the grid; each cell is a button while answering. */
export function VisualSearchView({
  challenge,
  phase,
  locate,
  answer,
}: ContentViewProps<VisualSearchChallenge>) {
  const { target, cells, columns } = challenge.content;
  const review = phase === 'review';
  const solution =
    challenge.response.format === 'locate' ? challenge.response.solution.index : null;
  const pick = answer?.format === 'locate' ? answer.index : (locate?.selectedIndex ?? null);

  const stateOf = (index: number): CellState => {
    if (!review) return 'idle';
    if (index === solution) return 'hit';
    if (index === pick) return 'wrong';
    return 'dim';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        Find:
        <Glyph glyph={target} decorative className="h-9 w-9" />
        <span className="font-medium text-ink">{glyphLabel(target)}</span>
      </p>
      <CellGrid
        label={`Search grid, ${cells.length} cells`}
        columns={columns}
        size={cells.length > 16 ? 'sm' : 'md'}
        cells={cells.map((glyph, i) => ({
          key: String(i),
          label: `row ${Math.floor(i / columns) + 1}, column ${(i % columns) + 1}, ${glyphLabel(glyph)}${
            review && i === solution ? ', target' : ''
          }${review && i === pick && i !== solution ? ', your pick' : ''}`,
          content: <Glyph glyph={glyph} decorative className="h-3/5 w-3/5" />,
          state: stateOf(i),
        }))}
        {...(locate !== null
          ? {
              onPress: (index: number) => {
                locate.onLocate(index);
              },
              disabled: locate.disabled,
            }
          : {})}
      />
    </div>
  );
}
