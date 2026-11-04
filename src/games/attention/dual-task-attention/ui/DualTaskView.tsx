import { useTranslation } from 'react-i18next';
import { joinText, msg } from '@/domain/shared';
import { ASSISTED_STUDY_FACTOR } from '@/domain/session';
import { useStepper } from '@/games/kit/ui';
import { useText } from '@/i18n';
import type { ContentViewProps } from '@/games/types';
import { markLabel } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import { numberCounts, numberWords, shapeCounts, shapeWords } from '../content/definition';
import type { DualTaskChallenge } from '../content/types';

const counted = msg('attention:dualTask.view.counted');

/** Plays the pairs during the study phase; the options are answered afterwards. */
export function DualTaskView({ challenge, phase, assisted }: ContentViewProps<DualTaskChallenge>) {
  const { t } = useTranslation('attention');
  const tx = useText();
  const { content } = challenge;
  const { items, itemMs } = content;
  const step = useStepper(
    items.length + 1,
    assisted ? itemMs * ASSISTED_STUDY_FACTOR : itemMs,
    phase === 'study',
    challenge.id,
  );
  const rules = tx(
    msg('attention:dualTask.view.rules', {
      numbers: numberWords(content),
      shapes: shapeWords(content),
    }),
  );
  if (phase === 'study') {
    const item = step >= 1 ? items[step - 1] : undefined;
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-ink-soft">{rules}</p>
        <div
          aria-live="assertive"
          aria-atomic="true"
          className="flex h-36 w-56 items-center justify-center gap-4 rounded-2xl border border-line bg-raised"
        >
          {item === undefined ? (
            <span className="text-sm text-ink-muted">
              {step === 0 ? t('dualTask.view.getReady') : t('dualTask.view.done')}
            </span>
          ) : (
            <span
              key={step}
              className="flex animate-fade-in items-center gap-4"
              aria-label={`${item.number}, ${tx(markLabel(item.mark))}`}
            >
              <span className="font-mono text-6xl font-bold text-ink">{item.number}</span>
              <MarkFace mark={item.mark} className="h-20 w-20" />
            </span>
          )}
        </div>
        <p aria-hidden="true" className="text-xs text-ink-muted">
          {step >= 1 && step <= items.length
            ? `${step} / ${items.length}`
            : t('dualTask.view.pairs', { count: items.length })}
        </p>
      </div>
    );
  }
  if (phase === 'respond') return <p className="text-center text-ink-soft">{rules}</p>;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-sm text-ink-soft">{t('dualTask.view.legend')}</p>
      <ol aria-label={t('dualTask.view.stream')} className="flex flex-wrap justify-center gap-2">
        {items.map((item, i) => {
          const n = numberCounts(content, item.number);
          const s = shapeCounts(content, item.mark);
          return (
            <li
              key={i}
              aria-label={tx(
                joinText(
                  [
                    joinText([`${i + 1}: ${item.number}`, ...(n ? [counted] : [])], ' '),
                    joinText([markLabel(item.mark), ...(s ? [counted] : [])], ' '),
                  ],
                  ', ',
                ),
              )}
              className="flex items-center gap-1 rounded-lg border border-line bg-raised px-2 py-1"
            >
              <span className={`font-mono font-bold ${n ? 'text-success' : 'text-ink-muted'}`}>
                {item.number}
                {n ? '#' : ''}
              </span>
              <MarkFace mark={item.mark} className="h-6 w-6" />
              {s && <span className="text-xs text-success">★</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
