import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { complexVisualInspectionGame } from './content/definition';
import type { InspectionChallenge } from './content/types';
import { InspectionView } from './ui/InspectionView';

export const complexVisualInspectionModule = defineGameModule<InspectionChallenge>({
  definition: complexVisualInspectionGame,
  ContentView: InspectionView,
  kindLabels: {
    positive: msg('attention:complexVisualInspection.kinds.positive'),
    negated: msg('attention:complexVisualInspection.kinds.negated'),
  },
});
