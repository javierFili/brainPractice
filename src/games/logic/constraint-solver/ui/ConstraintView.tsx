import { useTranslation } from 'react-i18next';
import { msg } from '@/domain/shared';
import { ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName } from '../content/solver';
import type { ConstraintChallenge } from '../content/types';

export function ConstraintView({ challenge, phase }: ContentViewProps<ConstraintChallenge>) {
  const { t } = useTranslation('logic');
  const { size, box, givens, inequalities, asked, solution } = challenge.content;
  const cols = Array.from({ length: size }, (_, c) => String.fromCharCode(65 + c));
  const reveal = phase === 'review';
  const rules = [
    msg('logic:constraintSolver.view.rowsRule', { size }),
    ...(box ? [msg('logic:constraintSolver.view.boxRule', { h: box[0], w: box[1], size })] : []),
  ];
  return (
    <div className="flex flex-col gap-4">
      <Panel title={t('shared.rules')}>
        <ClueList clues={rules} label={t('shared.rules')} />
      </Panel>
      <table
        aria-label={t('constraintSolver.view.grid', { size })}
        className="mx-auto table-fixed border-collapse text-center"
      >
        <thead>
          <tr>
            <td className="w-6" />
            {cols.map((c) => (
              <th key={c} scope="col" className="pb-1 text-xs font-semibold text-ink-muted">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: size }, (_, r) => (
            <tr key={r}>
              <th scope="row" className="pr-1 text-xs font-semibold text-ink-muted">
                {r + 1}
              </th>
              {cols.map((_, c) => {
                const i = r * size + c;
                const given = givens[i];
                const isAsked = i === asked;
                const thickRight = box !== null && c < size - 1 && (c + 1) % box[1] === 0;
                const thickBottom = box !== null && r < size - 1 && (r + 1) % box[0] === 0;
                const text =
                  given !== null && given !== undefined
                    ? String(given)
                    : isAsked
                      ? reveal
                        ? String(solution[i])
                        : '?'
                      : '';
                const name = t('constraintSolver.view.cell', {
                  cell: cellName(i, size),
                  value:
                    given !== null && given !== undefined
                      ? String(given)
                      : isAsked
                        ? reveal
                          ? t('constraintSolver.view.askedValue', { value: solution[i] })
                          : t('constraintSolver.view.asked')
                        : t('constraintSolver.view.empty'),
                });
                return (
                  <td
                    key={c}
                    aria-label={name}
                    className={`h-11 w-11 border border-line font-mono text-lg sm:h-12 sm:w-12 ${
                      thickRight ? 'border-r-4 border-r-line-strong' : ''
                    } ${thickBottom ? 'border-b-4 border-b-line-strong' : ''} ${
                      isAsked
                        ? 'bg-glow/20 font-bold text-glow outline-2 -outline-offset-2 outline-glow'
                        : given !== null
                          ? 'bg-raised text-ink'
                          : 'bg-surface text-ink-muted'
                    }`}
                  >
                    {text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {inequalities.length > 0 && (
        <Panel title={t('constraintSolver.view.smallerTitle')}>
          <ClueList
            label={t('constraintSolver.view.smallerLabel')}
            clues={inequalities.map(
              ({ smaller, larger }) => `${cellName(smaller, size)} < ${cellName(larger, size)}`,
            )}
          />
        </Panel>
      )}
    </div>
  );
}
