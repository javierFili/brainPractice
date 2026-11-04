import { useTranslation } from 'react-i18next';
import { joinText, msg, type Text } from '@/domain/shared';
import { CellGrid, useStepper } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName, type Mark } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import { changedCells, describeCell } from '../content/definition';
import type { ChangeDetectionChallenge } from '../content/types';

type Cell = Mark | null;

function Scene({
  cells,
  columns,
  label,
  changed = [],
}: {
  readonly cells: readonly Cell[] | null;
  readonly columns: number;
  readonly label: Text;
  readonly changed?: readonly number[];
}) {
  const count = cells?.length ?? 0;
  return (
    <CellGrid
      label={label}
      columns={columns}
      size={columns >= 5 ? 'sm' : 'md'}
      cells={Array.from({ length: count }, (_, i) => {
        const cell = cells?.[i] ?? null;
        const isChanged = changed.includes(i);
        return {
          key: String(i),
          label: joinText(
            [
              cellName(i, columns),
              describeCell(cell),
              ...(isChanged ? [msg('attention:changeDetection.view.changed')] : []),
            ],
            ', ',
          ),
          content: cell === null ? null : <MarkFace mark={cell} />,
          state: isChanged ? 'highlight' : 'idle',
        };
      })}
    />
  );
}

const FIRST_LOOK = msg('attention:changeDetection.view.firstLook');
const SECOND_LOOK = msg('attention:changeDetection.view.secondLook');

/** First look in the study phase; then a blank board for `gapMs`, then the second look. */
export function ChangeDetectionView({
  challenge,
  phase,
}: ContentViewProps<ChangeDetectionChallenge>) {
  const { t } = useTranslation('attention');
  const { before, after, columns, gapMs } = challenge.content;
  const step = useStepper(1, gapMs, phase === 'respond', challenge.id);
  if (phase === 'study') return <Scene cells={before} columns={columns} label={FIRST_LOOK} />;
  if (phase === 'review') {
    const changed = changedCells(before, after);
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-label={t('changeDetection.view.firstLook')}>
          <p className="mb-2 text-center text-xs font-semibold text-ink-muted uppercase">
            {t('changeDetection.view.firstLook')}
          </p>
          <Scene cells={before} columns={columns} label={FIRST_LOOK} changed={changed} />
        </section>
        <section aria-label={t('changeDetection.view.secondLook')}>
          <p className="mb-2 text-center text-xs font-semibold text-ink-muted uppercase">
            {t('changeDetection.view.secondLook')}{' '}
            {changed.length === 0 ? t('changeDetection.view.noChange') : ''}
          </p>
          <Scene cells={after} columns={columns} label={SECOND_LOOK} changed={changed} />
        </section>
      </div>
    );
  }
  const blank = step === 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <p aria-live="polite" className="text-sm text-ink-muted">
        {blank ? t('changeDetection.view.wait') : t('changeDetection.view.secondLook')}
      </p>
      {blank ? (
        <Scene
          cells={before.map(() => null)}
          columns={columns}
          label={msg('attention:changeDetection.view.blankBoard')}
        />
      ) : (
        <Scene cells={after} columns={columns} label={SECOND_LOOK} />
      )}
    </div>
  );
}
