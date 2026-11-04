import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { logicalDeductionGame } from './content/definition';
import type { DeductionChallenge } from './content/types';
import { LogicalDeductionView } from './ui/LogicalDeductionView';

export const logicalDeductionModule = defineGameModule<DeductionChallenge>({
  definition: logicalDeductionGame,
  ContentView: LogicalDeductionView,
  kindLabels: {
    'single-category': msg('logic:logicalDeduction.kinds.single'),
    'multi-category': msg('logic:logicalDeduction.kinds.multi'),
  },
});
