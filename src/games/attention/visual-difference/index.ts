import { defineGameModule } from '../../types';
import { visualDifferenceGame } from './content/definition';
import type { VisualDifferenceChallenge } from './content/types';
import { VisualDifferenceView } from './ui/VisualDifferenceView';

export const visualDifferenceModule = defineGameModule<VisualDifferenceChallenge>({
  definition: visualDifferenceGame,
  ContentView: VisualDifferenceView,
  kindLabels: { plain: 'Colour and shape', oriented: 'With turns and mirrors' },
});
