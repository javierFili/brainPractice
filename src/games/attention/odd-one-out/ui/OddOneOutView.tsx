import { CellGrid, type CellState } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName, markLabel } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import type { OddOneOutChallenge } from '../content/types';

export function OddOneOutView({ challenge, locate }: ContentViewProps<OddOneOutChallenge>) {
  const { items, columns } = challenge.content;
  const solution = locate?.solutionIndex ?? null;
  const picked = solution === null ? null : (locate?.selectedIndex ?? null);
  const stateOf = (i: number): CellState =>
    solution === null ? 'idle' : i === solution ? 'hit' : i === picked ? 'wrong' : 'dim';
  const interactive = locate !== null && !locate.disabled;
  return (
    <CellGrid
      label="Shapes"
      columns={columns}
      size={columns >= 5 ? 'sm' : 'md'}
      cells={items.map((item, i) => ({
        key: String(i),
        label: `${cellName(i, columns)}, ${markLabel(item)}`,
        content: <MarkFace mark={item} />,
        state: stateOf(i),
      }))}
      {...(locate !== null
        ? {
            onPress: (i: number) => {
              locate.onLocate(i);
            },
          }
        : {})}
      disabled={!interactive}
    />
  );
}
