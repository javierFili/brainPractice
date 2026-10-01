import type { ComponentProps } from 'react';

/** The single surface style shared by games, lessons, assessment and dashboard. */
export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 ${className}`}
      {...props}
    />
  );
}
