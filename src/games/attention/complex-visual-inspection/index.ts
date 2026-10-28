import { defineGameModule } from '../../types';
import { complexVisualInspectionGame } from './content/definition';
import type { InspectionChallenge } from './content/types';
import { InspectionView } from './ui/InspectionView';

export const complexVisualInspectionModule = defineGameModule<InspectionChallenge>({
  definition: complexVisualInspectionGame,
  ContentView: InspectionView,
  kindLabels: { positive: 'Shape, colour and direction', negated: 'Any colour except one' },
});
