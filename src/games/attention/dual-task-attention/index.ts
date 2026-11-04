import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { dualTaskGame } from './content/definition';
import type { DualTaskChallenge } from './content/types';
import { DualTaskView } from './ui/DualTaskView';

export const dualTaskModule = defineGameModule<DualTaskChallenge>({
  definition: dualTaskGame,
  ContentView: DualTaskView,
  kindLabels: {
    parity: msg('attention:dualTask.kinds.parity'),
    threshold: msg('attention:dualTask.kinds.threshold'),
  },
});
