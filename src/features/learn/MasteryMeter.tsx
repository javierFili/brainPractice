import { useTranslation } from 'react-i18next';
import { MASTERED, MASTERY_DIMENSIONS, type ConceptMastery } from '@/domain/learning';
import type { Text } from '@/domain/shared';
import { useFormat, useText } from '@/i18n';

/** Three bars per concept, with the figure in text (never colour alone). */
export function MasteryMeter({
  mastery,
  name,
}: {
  mastery: ConceptMastery | undefined;
  name: Text;
}) {
  const { t } = useTranslation(['learn', 'lessons']);
  const tx = useText();
  const format = useFormat();
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-white">{tx(name)}</p>
      <dl className="grid gap-1 text-xs">
        {MASTERY_DIMENSIONS.map((dimension) => {
          const value = mastery?.[dimension] ?? 0;
          return (
            <div key={dimension} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2">
              <dt className="text-slate-400">{t(`mastery.${dimension}`)}</dt>
              <dd className="h-1.5 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
                <div
                  className={`h-full rounded-full ${value >= MASTERED ? 'bg-emerald-400' : 'bg-sky-400'}`}
                  style={{ width: `${Math.round(value * 100)}%` }}
                />
              </dd>
              <dd className="text-right font-mono text-slate-300 tabular-nums">
                {format.percent(value)}
                {value >= MASTERED && <span className="sr-only"> {t('mastery.mastered')}</span>}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
