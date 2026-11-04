import { useTranslation } from 'react-i18next';
import { Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { useText } from '@/i18n';
import { describeClaim } from '../content/solver';
import type { TruthChallenge } from '../content/types';

export function TruthView({ challenge, phase }: ContentViewProps<TruthChallenge>) {
  const { t } = useTranslation('logic');
  const tx = useText();
  const { names, claims, solution } = challenge.content;
  return (
    <Panel title={t('truthAndFalsehood.view.title')}>
      <ul aria-label={t('truthAndFalsehood.view.statements')} className="flex flex-col gap-2">
        {claims.map((claim, i) => (
          <li
            key={names[i]}
            className="flex flex-col gap-1 rounded-lg border border-line bg-raised p-3 sm:flex-row sm:items-baseline sm:gap-3"
          >
            <span className="font-semibold text-ink">
              {names[i]}
              {phase === 'review' && (
                <span className="ml-2 text-xs font-normal text-ink-muted">
                  ({t(`truthAndFalsehood.roleLower.${solution[i] ? 'honest' : 'liar'}`)})
                </span>
              )}
              <span className="sr-only"> {t('truthAndFalsehood.view.says')}</span>
            </span>
            <q className="text-ink-soft">
              {t('shared.sentence', { text: tx(describeClaim(claim, i, names)) })}
            </q>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
