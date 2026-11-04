import type { ChoiceOption } from '@/domain/challenge';
import { msg, type Text } from '@/domain/shared';
import { NumberFace } from './NumberFace';

/** Large tabular numerals on the answer buttons. */
export const renderNumberOption = (option: ChoiceOption) => <NumberFace option={option} />;

/** Screen readers say "3/4" as a date or "3 slash 4"; spell fractions and operators out. */
export const describeNumberOption = (label: string): Text | undefined => {
  const fraction = /^(\d+)\/(\d+)$/.exec(label);
  if (fraction) {
    return msg('speed:numberComparison.spoken.fraction', {
      num: fraction[1] ?? '',
      den: fraction[2] ?? '',
    });
  }
  const operation = /^(\d+) ([−×+]) (\d+)$/.exec(label);
  if (operation === null || operation[2] === '+') return undefined;
  return msg(`speed:numberComparison.spoken.${operation[2] === '−' ? 'minus' : 'times'}`, {
    a: operation[1] ?? '',
    b: operation[3] ?? '',
  });
};
