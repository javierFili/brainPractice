import { useTranslation } from 'react-i18next';
import { joinText, msg } from '@/domain/shared';
import { useText } from '@/i18n';
import { MultiSelectBoard } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName, markLabel, mark } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import { targetPhrase } from '../content/definition';
import type { DistractorFilteringChallenge } from '../content/types';

export function DistractorFilteringView({
  challenge,
  respond,
  answer,
}: ContentViewProps<DistractorFilteringChallenge>) {
  const { t } = useTranslation('attention');
  const tx = useText();
  const { items, columns, target, kind } = challenge.content;
  const { response } = challenge;
  if (response.format !== 'multi-select') throw new Error('Distractor Filtering uses multi-select');
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="flex items-center gap-2 rounded-lg border border-line bg-raised px-3 py-1.5 text-sm text-ink-soft">
        {t('distractorFiltering.view.rule')}
        {kind === 'conjunction' && (
          <MarkFace mark={mark(target.shape, target.color)} className="h-7 w-7" />
        )}
        <span className="font-semibold text-ink">{tx(targetPhrase(kind, target))}</span>
      </p>
      <MultiSelectBoard
        response={response}
        label={msg('attention:distractorFiltering.view.items')}
        columns={columns}
        size={columns >= 5 ? 'sm' : 'md'}
        respond={respond}
        answer={answer}
        cells={items.map((m, i) => ({
          key: String(i),
          label: joinText([cellName(i, columns), markLabel(m)], ', '),
          content: <MarkFace mark={m} />,
        }))}
      />
    </div>
  );
}
