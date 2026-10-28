import { defineGameModule } from '../../types';
import { strategyPuzzleGame } from './content/definition';
import type { StrategyChallenge } from './content/types';
import { StrategyView } from './ui/StrategyView';

export const strategyPuzzleModule = defineGameModule<StrategyChallenge>({
  definition: strategyPuzzleGame,
  ContentView: StrategyView,
  kindLabels: {
    'take-away': 'Coin game, one pile',
    piles: 'Coin game, several piles',
    jugs: 'Water jugs',
    sliding: 'Sliding tiles',
  },
});
