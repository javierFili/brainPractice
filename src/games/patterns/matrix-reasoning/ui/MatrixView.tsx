import type { ContentViewProps } from '@/games/types';
import { figureLabel } from '../../shared/content';
import { FigureFace, Missing } from '../../shared/ui';
import type { MatrixChallenge } from '../content/types';

export function MatrixView({ challenge }: ContentViewProps<MatrixChallenge>) {
  const { cells, size } = challenge.content;
  return (
    <ol
      aria-label={`Matrix, ${size} rows by ${size} columns, one cell missing`}
      className={`mx-auto grid w-full gap-1.5 sm:gap-2 ${size === 2 ? 'max-w-56 grid-cols-2' : 'max-w-80 grid-cols-3'}`}
    >
      {cells.flatMap((row, r) =>
        row.map((cell, c) => {
          const where = `Row ${r + 1}, column ${c + 1}`;
          return (
            <li
              key={`${r}:${c}`}
              aria-label={cell === null ? `${where}: missing` : `${where}: ${figureLabel(cell)}`}
              className="flex aspect-square items-center justify-center rounded-lg border border-line bg-raised p-1"
            >
              {cell === null ? (
                <Missing label="Missing cell" className="h-full w-full" />
              ) : (
                <FigureFace figure={cell} size={size === 3 ? 'sm' : 'md'} label={false} />
              )}
            </li>
          );
        }),
      )}
    </ol>
  );
}
