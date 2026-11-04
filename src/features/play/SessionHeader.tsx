import {
  effectiveLimitMs,
  effectiveStudyMs,
  progress,
  responseDeadline,
  runningScore,
  studyDeadline,
  type SessionState,
} from '@/domain/session';
import { useTranslation } from 'react-i18next';
import type { Text } from '@/domain/shared';
import type { Clock } from '@/domain/time/Clock';
import { Countdown } from '@/components/feedback/Countdown';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFormat, useText } from '@/i18n';

export function SessionHeader({
  state,
  clock,
  title,
}: {
  state: SessionState;
  clock: Clock;
  title: Text;
}) {
  const { t } = useTranslation('play');
  const tx = useText();
  const format = useFormat();
  const { completed, total } = progress(state);
  const study = studyDeadline(state);
  const response = responseDeadline(state);
  const limit = effectiveLimitMs(state);
  const studyMs = effectiveStudyMs(state);

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
        <p className="font-medium text-white">
          {tx(title)}{' '}
          <span className="text-slate-400">
            · {t('common:level.label', { level: state.settings.level })}
          </span>
          {state.settings.assisted && (
            <span className="ml-2 text-xs text-sky-300">{t('header.relaxed')}</span>
          )}
        </p>
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono tabular-nums">
          <div className="flex gap-1.5">
            <dt className="text-slate-400">{t('header.challenge')}</dt>
            <dd className="text-white">
              {Math.min(state.index + 1, total)} / {total}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-slate-400">{t('header.score')}</dt>
            <dd className="text-white" aria-live="polite">
              {format.points(runningScore(state))}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-slate-400">{t('header.streak')}</dt>
            <dd className="text-white">{state.streak}</dd>
          </div>
        </dl>
        {study !== null && studyMs !== null && (
          <Countdown
            clock={clock}
            deadline={study}
            durationMs={studyMs}
            label={t('header.studyLeft')}
          />
        )}
        {response !== null && limit !== null && (
          <Countdown
            clock={clock}
            deadline={response}
            durationMs={limit}
            label={t('header.timeLeft')}
          />
        )}
      </div>
      <ProgressBar value={completed} max={total} label={t('header.progress')} />
    </div>
  );
}
