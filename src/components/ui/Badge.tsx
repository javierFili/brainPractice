import type { ReactNode } from 'react';

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300 ${className}`}
    >
      {children}
    </span>
  );
}
