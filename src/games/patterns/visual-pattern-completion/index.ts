import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { renderPatternOption } from '../shared/ui';
import { visualPatternGame } from './content/definition';
import type { VisualPatternChallenge } from './content/types';
import { VisualPatternView } from './ui/VisualPatternView';

export const visualPatternModule = defineGameModule<VisualPatternChallenge>({
  definition: visualPatternGame,
  ContentView: VisualPatternView,
  kindLabels: {
    repeat: msg('patterns:visualPatternCompletion.kinds.repeat'),
    'two-rules': msg('patterns:visualPatternCompletion.kinds.two-rules'),
    growing: msg('patterns:visualPatternCompletion.kinds.growing'),
  },
  renderOption: renderPatternOption,
});
