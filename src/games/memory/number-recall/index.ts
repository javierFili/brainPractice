import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { numberRecallGame } from './content/definition';
import type { NumberRecallChallenge } from './content/types';
import { NumberRecallView } from './ui/NumberRecallView';

export const numberRecallModule = defineGameModule<NumberRecallChallenge>({
  definition: numberRecallGame,
  ContentView: NumberRecallView,
  kindLabels: {
    'type-back': msg('memory:numberRecall.kinds.typeBack'),
    'which-group': msg('memory:numberRecall.kinds.whichGroup'),
    'two-numbers': msg('memory:numberRecall.kinds.twoNumbers'),
  },
  describeOption: (label) => label.split('').join(' '),
});
