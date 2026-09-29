import type { Clock } from '@/domain/time/Clock';
import { useNow } from '@/hooks/useNow';

/** Visual + textual countdown. Announces only the last seconds to avoid screen reader noise. */
export function Countdown({
  clock,
  deadline,
  durationMs,
  label,
}: {
  clock: Clock;
  deadline: number;
  durationMs: number;
  label: string;
}) {
  const now = useNow(clock, true, 100);
  const remaining = Math.max(0, deadline - now);
  const ratio = durationMs > 0 ? remaining / durationMs : 0;
  const seconds = Math.ceil(remaining / 1000);
  const urgent = ratio < 0.2;
  return (
    <div className="flex min-w-40 items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
        <div
          className={`h-full rounded-full ${urgent ? 'bg-rose-400' : 'bg-sky-400'}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span
        className={`font-mono text-sm tabular-nums ${urgent ? 'text-rose-300' : 'text-slate-300'}`}
      >
        <span className="sr-only">{label}: </span>
        {seconds}s
      </span>
      {urgent && (
        <span role="status" className="sr-only">
          {seconds} seconds left
        </span>
      )}
    </div>
  );
}
