import type { ChoiceOption } from '@/domain/challenge';

/** Large tabular numerals on the answer buttons. */
export const renderNumberOption = (option: ChoiceOption) => (
  <span className="block py-1 text-center font-mono text-2xl font-semibold text-ink tabular-nums">
    {option.label}
  </span>
);

/** Screen readers say "3/4" as a date or "3 slash 4"; spell fractions and operators out. */
export const describeNumberOption = (label: string) => {
  const fraction = /^(\d+)\/(\d+)$/.exec(label);
  if (fraction) return `${fraction[1]} over ${fraction[2]}`;
  if (label.includes('−') || label.includes('×'))
    return label.replace('−', 'minus').replace('×', 'times');
  return undefined;
};
