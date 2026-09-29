import type { ReactNode } from 'react';

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <dt className="text-xs font-medium tracking-wide text-slate-400 uppercase">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-semibold text-slate-50 tabular-nums">{value}</dd>
      {hint !== undefined && <dd className="mt-1 text-xs text-slate-400">{hint}</dd>}
    </div>
  );
}
