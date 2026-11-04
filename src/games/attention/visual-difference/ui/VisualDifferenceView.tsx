import { useTranslation } from 'react-i18next';
import { joinText, msg } from '@/domain/shared';
import { CellGrid, MultiSelectBoard } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName, markLabel } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import type { VisualDifferenceChallenge } from '../content/types';

const heading = 'mb-2 text-center text-xs font-semibold tracking-wide text-ink-muted uppercase';

export function VisualDifferenceView({
  challenge,
  respond,
  answer,
}: ContentViewProps<VisualDifferenceChallenge>) {
  const { t } = useTranslation('attention');
  const { left, right, columns } = challenge.content;
  const { response } = challenge;
  if (response.format !== 'multi-select') throw new Error('Visual Difference uses multi-select');
  const size = columns >= 4 ? 'sm' : 'md';
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
      <section aria-label={t('visualDifference.view.leftPicture')}>
        <h3 aria-hidden="true" className={heading}>
          {t('visualDifference.view.left')}
        </h3>
        <CellGrid
          label={msg('attention:visualDifference.view.leftPicture')}
          columns={columns}
          size={size}
          cells={left.map((m, i) => ({
            key: String(i),
            label: joinText(
              [msg('attention:visualDifference.view.leftCell'), cellName(i, columns), markLabel(m)],
              ', ',
            ),
            content: <MarkFace mark={m} />,
          }))}
        />
      </section>
      <section aria-label={t('visualDifference.view.rightPicture')}>
        <h3 aria-hidden="true" className={heading}>
          {t('visualDifference.view.rightHeading')}
        </h3>
        <MultiSelectBoard
          response={response}
          label={msg('attention:visualDifference.view.rightPicture')}
          columns={columns}
          size={size}
          respond={respond}
          answer={answer}
          submitLabel={msg('kit:board.check')}
          cells={right.map((m, i) => ({
            key: String(i),
            label: joinText(
              [
                msg('attention:visualDifference.view.rightCell'),
                cellName(i, columns),
                markLabel(m),
              ],
              ', ',
            ),
            content: <MarkFace mark={m} />,
          }))}
        />
      </section>
    </div>
  );
}
