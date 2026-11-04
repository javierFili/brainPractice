import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { numberPatternGame } from './content/definition';
import type { NumberPatternChallenge } from './content/types';
import { NumberPatternView } from './ui/NumberPatternView';

export const numberPatternModule = defineGameModule<NumberPatternChallenge>({
  definition: numberPatternGame,
  ContentView: NumberPatternView,
  kindLabels: {
    grid: msg('patterns:numberPatternCompletion.kinds.grid'),
    pyramid: msg('patterns:numberPatternCompletion.kinds.pyramid'),
    wheel: msg('patterns:numberPatternCompletion.kinds.wheel'),
    cross: msg('patterns:numberPatternCompletion.kinds.cross'),
  },
});
