import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { symbolCountingGame } from './content/definition';
import type { SymbolCountingChallenge } from './content/types';
import { SymbolCountingView } from './ui/SymbolCountingView';

export const symbolCountingModule = defineGameModule<SymbolCountingChallenge>({
  definition: symbolCountingGame,
  ContentView: SymbolCountingView,
  kindLabels: {
    plain: msg('attention:symbolCounting.kinds.plain'),
    lookalike: msg('attention:symbolCounting.kinds.lookalike'),
    oriented: msg('attention:symbolCounting.kinds.oriented'),
  },
});
