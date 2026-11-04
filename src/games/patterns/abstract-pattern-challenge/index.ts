import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { abstractPatternGame } from './content/definition';
import type { AbstractChallenge } from './content/types';
import { AbstractView } from './ui/AbstractView';

export const abstractPatternModule = defineGameModule<AbstractChallenge>({
  definition: abstractPatternGame,
  ContentView: AbstractView,
  kindLabels: {
    colour: msg('patterns:abstractPatternChallenge.kinds.colour'),
    shape: msg('patterns:abstractPatternChallenge.kinds.shape'),
    count: msg('patterns:abstractPatternChallenge.kinds.count'),
    direction: msg('patterns:abstractPatternChallenge.kinds.direction'),
    order: msg('patterns:abstractPatternChallenge.kinds.order'),
  },
});
