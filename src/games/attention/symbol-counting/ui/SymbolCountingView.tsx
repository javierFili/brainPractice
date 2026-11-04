import { useTranslation } from 'react-i18next';
import { joinText, msg } from '@/domain/shared';
import { useText } from '@/i18n';
import { CellGrid, type CellState } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName, markLabel, sameLook } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import type { SymbolCountingChallenge } from '../content/types';

export function SymbolCountingView({
  challenge,
  phase,
}: ContentViewProps<SymbolCountingChallenge>) {
  const { t } = useTranslation('attention');
  const tx = useText();
  const { items, columns, target } = challenge.content;
  const review = phase === 'review';
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="flex items-center gap-2 rounded-lg border border-line bg-raised px-3 py-1.5 text-sm text-ink-soft">
        {t('symbolCounting.view.count')}
        <MarkFace mark={target} className="h-8 w-8" />
        <span className="font-semibold text-ink">{tx(markLabel(target))}</span>
      </p>
      <CellGrid
        label={msg('attention:symbolCounting.view.field')}
        columns={columns}
        size={columns >= 5 ? 'sm' : 'md'}
        cells={items.map((m, i) => {
          const hit = sameLook(m, target);
          const state: CellState = review ? (hit ? 'hit' : 'dim') : 'idle';
          return {
            key: String(i),
            label: joinText([cellName(i, columns), markLabel(m)], ', '),
            content: <MarkFace mark={m} />,
            state,
          };
        })}
      />
    </div>
  );
}
