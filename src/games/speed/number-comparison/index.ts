import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { numberComparisonGame } from './content/definition';
import type { NumberComparisonChallenge } from './content/types';
import { describeNumberOption, renderNumberOption } from './ui/numberOptions';
import { NumberComparisonView } from './ui/NumberComparisonView';

export const numberComparisonModule = defineGameModule<NumberComparisonChallenge>({
  definition: numberComparisonGame,
  ContentView: NumberComparisonView,
  kindLabels: {
    integers: msg('speed:numberComparison.kinds.integers'),
    decimals: msg('speed:numberComparison.kinds.decimals'),
    fractions: msg('speed:numberComparison.kinds.fractions'),
    expressions: msg('speed:numberComparison.kinds.expressions'),
  },
  renderOption: renderNumberOption,
  describeOption: describeNumberOption,
});
