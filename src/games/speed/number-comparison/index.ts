import { defineGameModule } from '../../types';
import { numberComparisonGame } from './content/definition';
import type { NumberComparisonChallenge } from './content/types';
import { describeNumberOption, renderNumberOption } from './ui/numberOptions';
import { NumberComparisonView } from './ui/NumberComparisonView';

export const numberComparisonModule = defineGameModule<NumberComparisonChallenge>({
  definition: numberComparisonGame,
  ContentView: NumberComparisonView,
  kindLabels: {
    integers: 'Whole numbers',
    decimals: 'Decimals',
    fractions: 'Fractions',
    expressions: 'Calculations',
  },
  renderOption: renderNumberOption,
  describeOption: describeNumberOption,
});
