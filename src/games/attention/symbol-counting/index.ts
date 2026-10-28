import { defineGameModule } from '../../types';
import { symbolCountingGame } from './content/definition';
import type { SymbolCountingChallenge } from './content/types';
import { SymbolCountingView } from './ui/SymbolCountingView';

export const symbolCountingModule = defineGameModule<SymbolCountingChallenge>({
  definition: symbolCountingGame,
  ContentView: SymbolCountingView,
  kindLabels: {
    plain: 'Distinct fillers',
    lookalike: 'Colour and shape look-alikes',
    oriented: 'Direction look-alikes',
  },
});
