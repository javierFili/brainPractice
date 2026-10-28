import { defineGameModule } from '../../types';
import { logicalDeductionGame } from './content/definition';
import type { DeductionChallenge } from './content/types';
import { LogicalDeductionView } from './ui/LogicalDeductionView';

export const logicalDeductionModule = defineGameModule<DeductionChallenge>({
  definition: logicalDeductionGame,
  ContentView: LogicalDeductionView,
  kindLabels: {
    'single-category': 'One list to match',
    'multi-category': 'Several lists to match',
  },
});
