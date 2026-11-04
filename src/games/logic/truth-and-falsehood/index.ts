import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { truthAndFalsehoodGame } from './content/definition';
import type { TruthChallenge } from './content/types';
import { TruthView } from './ui/TruthView';

export const truthAndFalsehoodModule = defineGameModule<TruthChallenge>({
  definition: truthAndFalsehoodGame,
  ContentView: TruthView,
  kindLabels: {
    one: msg('logic:truthAndFalsehood.kinds.one'),
    who: msg('logic:truthAndFalsehood.kinds.who'),
    count: msg('logic:truthAndFalsehood.kinds.count'),
  },
});
