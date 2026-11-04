import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { variableTrackingGame } from './content/definition';
import type { TrackingChallenge } from './content/types';
import { VariableTrackingView } from './ui/VariableTrackingView';

export const variableTrackingModule = defineGameModule<TrackingChallenge>({
  definition: variableTrackingGame,
  ContentView: VariableTrackingView,
  kindLabels: {
    'final-value': msg('programming:variableTracking.kinds.finalValue'),
    'after-line': msg('programming:variableTracking.kinds.afterLine'),
    largest: msg('programming:variableTracking.kinds.largest'),
  },
});
