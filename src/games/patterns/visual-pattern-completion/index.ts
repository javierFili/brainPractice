import { defineGameModule } from '../../types';
import { renderPatternOption } from '../shared/ui';
import { visualPatternGame } from './content/definition';
import type { VisualPatternChallenge } from './content/types';
import { VisualPatternView } from './ui/VisualPatternView';

export const visualPatternModule = defineGameModule<VisualPatternChallenge>({
  definition: visualPatternGame,
  ContentView: VisualPatternView,
  kindLabels: {
    repeat: 'Repeating blocks',
    'two-rules': 'Two separate cycles',
    growing: 'Growing and turning',
  },
  renderOption: renderPatternOption,
});
