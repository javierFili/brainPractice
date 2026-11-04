import { Trans, useTranslation } from 'react-i18next';
import type { WeekSummary } from '@/domain/profile';

const weekdayFormats = new Map<string, Intl.DateTimeFormat>();

/** Short weekday name ("Mon", "lun", "Mo.") of a `YYYY-MM-DD` day key, in the given language. */
function weekdayName(language: string, day: string): string {
  let format = weekdayFormats.get(language);
  if (!format) {
    format = new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' });
    weekdayFormats.set(language, format);
  }
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return format.format(new Date(Date.UTC(y, m - 1, d)));
}

/** Days practised this week against the learner's own target. Informative, never a threat. */
export function WeekStrip({ week }: { week: WeekSummary }) {
  const { t, i18n } = useTranslation('home');
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ol className="flex gap-1.5" aria-label={t('week.label')}>
        {week.days.map(({ day, active }) => {
          const name = weekdayName(i18n.language, day);
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
                  {t(active ? 'week.practised' : 'week.notPractised', { day: name })}
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
        <Trans
          t={t}
          i18nKey={week.reached ? 'week.summaryReached' : 'week.summary'}
          values={{ active: week.activeCount, count: week.target }}
          count={week.target}
          components={{ b: <span className="font-semibold text-white" /> }}
        />
        {week.streak > 1 && (
          <span className="text-slate-400">{t('week.run', { count: week.streak })}</span>
        )}
      </p>
    </div>
  );
}
