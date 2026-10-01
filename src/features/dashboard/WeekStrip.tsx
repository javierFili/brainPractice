import type { WeekSummary } from '@/domain/profile';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Days practised this week against the learner's own target. Informative, never a threat. */
export function WeekStrip({ week }: { week: WeekSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ol className="flex gap-1.5" aria-label="Last seven days">
        {week.days.map(({ day, active }) => {
          const [y, m, d] = day.split('-').map(Number) as [number, number, number];
          const name = WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? '';
          return (
            <li key={day} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                  active
                    ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-100'
                    : 'border-slate-700 text-slate-500'
                }`}
              >
                <span aria-hidden="true">{active ? '✓' : ''}</span>
                <span className="sr-only">
                  {name} {active ? 'practised' : 'not practised'}
                </span>
              </span>
              <span aria-hidden="true" className="text-[10px] text-slate-500">
                {name.slice(0, 2)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-slate-300">
        <span className="font-semibold text-white">
          {week.activeCount} of {week.target}
        </span>{' '}
        days this week{week.reached ? ' — target reached' : ''}
        {week.streak > 1 && <span className="text-slate-400"> · {week.streak}-day run</span>}
      </p>
    </div>
  );
}
