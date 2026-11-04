import { useTranslation } from 'react-i18next';
import type { ContentViewProps } from '@/games/types';
import { useText } from '@/i18n';
import { Shape } from '../../shared/ui';
import { panelText } from '../content/definition';
import type { AbstractChallenge } from '../content/types';

export function AbstractView({ challenge }: ContentViewProps<AbstractChallenge>) {
  const { t } = useTranslation('patterns');
  const tx = useText();
  const { panels } = challenge.content;
  return (
    <ol
      aria-label={t('abstractPatternChallenge.view.panels')}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3"
    >
      {panels.map((panel, i) => (
        <li
          key={i}
          aria-label={t('abstractPatternChallenge.view.panel', {
            index: i + 1,
            figures: tx(panelText(panel)),
          })}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-raised px-2 py-2"
        >
          <span aria-hidden="true" className="text-xs font-semibold text-ink-muted">
            {t('abstractPatternChallenge.panel', { index: i + 1 })}
          </span>
          <span aria-hidden="true" className="flex items-center justify-center gap-1">
            {panel.map((f, j) => (
              <Shape key={j} figure={f} className="h-7 w-7 sm:h-8 sm:w-8" />
            ))}
          </span>
        </li>
      ))}
    </ol>
  );
}
