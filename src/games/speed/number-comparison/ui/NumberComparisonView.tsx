import { useTranslation } from 'react-i18next';
import type { ContentViewProps } from '@/games/types';
import type { NumberComparisonChallenge } from '../content/types';

/** The options themselves are the numbers; the view states the rule in large type. */
export function NumberComparisonView({
  challenge,
  phase,
}: ContentViewProps<NumberComparisonChallenge>) {
  const { t } = useTranslation('speed');
  const { ask, items, kind } = challenge.content;
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-2xl font-semibold tracking-wide text-glow uppercase">
        {t(`numberComparison.view.ask.${ask}`)}
      </p>
      <p className="text-sm text-ink-muted">
        {t(`numberComparison.view.summary.${ask}`, { count: items.length })}
      </p>
      {phase === 'review' && kind === 'expressions' && (
        <ul
          aria-label={t('numberComparison.view.values')}
          className="flex flex-wrap justify-center gap-3 text-sm text-ink-soft"
        >
          {items.map((q) => (
            <li key={q.label}>
              {q.label} = <span className="font-semibold text-ink">{q.num / q.den}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
