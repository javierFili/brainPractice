import { useTranslation } from 'react-i18next';
import type { ContentViewProps } from '@/games/types';
import { useText } from '@/i18n';
import { figureLabel } from '../../shared/content';
import { FigureFace, Missing } from '../../shared/ui';
import type { MatrixChallenge } from '../content/types';

export function MatrixView({ challenge }: ContentViewProps<MatrixChallenge>) {
  const { t } = useTranslation('patterns');
  const tx = useText();
  const { cells, size } = challenge.content;
  return (
    <ol
      aria-label={t('matrixReasoning.view.matrix', { size })}
      className={`mx-auto grid w-full gap-1.5 sm:gap-2 ${size === 2 ? 'max-w-56 grid-cols-2' : 'max-w-80 grid-cols-3'}`}
    >
      {cells.flatMap((row, r) =>
        row.map((cell, c) => {
          const where = { row: r + 1, column: c + 1 };
          return (
            <li
              key={`${r}:${c}`}
              aria-label={
                cell === null
                  ? t('matrixReasoning.view.missingAt', where)
                  : t('matrixReasoning.view.cell', { ...where, figure: tx(figureLabel(cell)) })
              }
              className="flex aspect-square items-center justify-center rounded-lg border border-line bg-raised p-1"
            >
              {cell === null ? (
                <Missing label={t('matrixReasoning.view.missing')} className="h-full w-full" />
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
