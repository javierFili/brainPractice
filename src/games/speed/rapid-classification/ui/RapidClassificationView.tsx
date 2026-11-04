import { useTranslation } from 'react-i18next';
import { useText } from '@/i18n';
import { ObjectFace } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import type { RapidClassificationChallenge } from '../content/types';

/** The object (picture and/or word) and, in switch levels, the cue naming the rule. */
export function RapidClassificationView({
  challenge,
}: ContentViewProps<RapidClassificationChallenge>) {
  const { t } = useTranslation('speed');
  const tx = useText();
  const { kind, rule, item, showPicture } = challenge.content;
  return (
    <div className="flex flex-col items-center gap-4">
      {kind === 'switch' &&
        (rule === 'category' ? (
          <p className="flex items-center gap-2 rounded-full border border-brand/60 bg-brand/10 px-4 py-1 text-sm font-semibold tracking-wide text-brand-strong">
            <span aria-hidden="true">▦</span> {t('rapidClassification.view.ruleCategory')}
          </p>
        ) : (
          <p className="flex items-center gap-2 rounded-full border border-glow/60 bg-glow/10 px-4 py-1 text-sm font-semibold tracking-wide text-glow">
            <span aria-hidden="true" className="font-mono">
              Aa
            </span>{' '}
            {t('rapidClassification.view.ruleLetter')}
          </p>
        ))}
      <div className="flex min-h-36 w-full max-w-xs flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-raised p-4">
        {showPicture && <ObjectFace item={item} className="text-6xl" />}
        <span
          aria-hidden={showPicture}
          className={showPicture ? 'text-lg text-ink-soft' : 'text-3xl font-semibold text-ink'}
        >
          {tx(item.label)}
        </span>
      </div>
    </div>
  );
}
