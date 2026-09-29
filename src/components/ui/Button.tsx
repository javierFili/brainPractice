import type { ComponentProps } from 'react';
import { Link, type LinkProps } from 'react-router';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-sky-400 text-slate-950 hover:bg-sky-300',
  secondary:
    'border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500 hover:bg-slate-800',
  ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white',
  danger: 'border border-rose-500/50 text-rose-200 hover:bg-rose-500/10',
};

const buttonClass = (variant: Variant = 'primary', extra = '') =>
  `${base} ${variants[variant]} ${extra}`;

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  className = '',
  ...props
}: LinkProps & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}
