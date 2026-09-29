import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow !== undefined && (
          <p className="mb-2 text-xs font-semibold tracking-widest text-slate-400 uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
        {description !== undefined && <p className="mt-3 text-slate-400">{description}</p>}
      </div>
      {actions !== undefined && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
