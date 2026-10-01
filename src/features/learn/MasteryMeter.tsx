import { MASTERED, MASTERY_DIMENSIONS, type ConceptMastery } from '@/domain/learning';
import { formatPercent } from '@/features/shared/format';

const LABEL = {
  understanding: 'Understanding',
  application: 'Application',
  debugging: 'Debugging',
} as const;

/** Three bars per concept, with the figure in text (never colour alone). */
export function MasteryMeter({
  mastery,
  name,
}: {
  mastery: ConceptMastery | undefined;
  name: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-white">{name}</p>
      <dl className="grid gap-1 text-xs">
        {MASTERY_DIMENSIONS.map((dimension) => {
          const value = mastery?.[dimension] ?? 0;
          return (
            <div key={dimension} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-2">
              <dt className="text-slate-400">{LABEL[dimension]}</dt>
              <dd className="h-1.5 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
                <div
                  className={`h-full rounded-full ${value >= MASTERED ? 'bg-emerald-400' : 'bg-sky-400'}`}
                  style={{ width: `${Math.round(value * 100)}%` }}
                />
              </dd>
              <dd className="text-right font-mono text-slate-300 tabular-nums">
                {formatPercent(value)}
                {value >= MASTERED && <span className="sr-only"> mastered</span>}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
