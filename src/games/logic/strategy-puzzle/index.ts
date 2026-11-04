import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { strategyPuzzleGame } from './content/definition';
import type { StrategyChallenge } from './content/types';
import { StrategyView } from './ui/StrategyView';

export const strategyPuzzleModule = defineGameModule<StrategyChallenge>({
  definition: strategyPuzzleGame,
  ContentView: StrategyView,
  kindLabels: {
    'take-away': msg('logic:strategyPuzzle.kinds.take-away'),
    piles: msg('logic:strategyPuzzle.kinds.piles'),
    jugs: msg('logic:strategyPuzzle.kinds.jugs'),
    sliding: msg('logic:strategyPuzzle.kinds.sliding'),
  },
});
