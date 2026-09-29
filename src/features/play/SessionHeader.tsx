import {
  effectiveLimitMs,
  progress,
  responseDeadline,
  runningScore,
  studyDeadline,
  type SessionState,
} from '@/domain/session';
import type { Clock } from '@/domain/time/Clock';
import { Countdown } from '@/components/feedback/Countdown';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatPoints } from '@/features/shared/format';

export function SessionHeader({
  state,
  clock,
  title,
}: {
  state: SessionState;
  clock: Clock;
  title: string;
}) {
  const { completed, total } = progress(state);
  const current = state.challenges[state.index];
  const study = studyDeadline(state);
  const response = responseDeadline(state);
  const limit = effectiveLimitMs(state);

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm">
        <p className="font-medium text-white">
          {title} <span className="text-slate-400">· Level {state.settings.level}</span>
          {state.settings.assisted && (
            <span className="ml-2 text-xs text-sky-300">Relaxed timing</span>
          )}
        </p>
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono tabular-nums">
          <div className="flex gap-1.5">
            <dt className="text-slate-400">Challenge</dt>
            <dd className="text-white">
              {Math.min(state.index + 1, total)} / {total}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-slate-400">Score</dt>
            <dd className="text-white" aria-live="polite">
              {formatPoints(runningScore(state))}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-slate-400">Streak</dt>
            <dd className="text-white">{state.streak}</dd>
          </div>
        </dl>
        {study !== null && current?.timing.studyMs != null && (
          <Countdown
            clock={clock}
            deadline={study}
            durationMs={current.timing.studyMs}
            label="Memorisation time left"
          />
        )}
        {response !== null && limit !== null && (
          <Countdown clock={clock} deadline={response} durationMs={limit} label="Time left" />
        )}
      </div>
      <ProgressBar value={completed} max={total} label="Session progress" />
    </div>
  );
}
