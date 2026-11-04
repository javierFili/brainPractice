import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { rapidSymbolMatchingGame } from './content/definition';
import type { SymbolMatchChallenge } from './content/types';
import { describeSymbolOption, renderSymbolOption } from './ui/symbolOptions';
import { SymbolMatchView } from './ui/SymbolMatchView';

export const rapidSymbolMatchingModule = defineGameModule<SymbolMatchChallenge>({
  definition: rapidSymbolMatchingGame,
  ContentView: SymbolMatchView,
  kindLabels: {
    'same-different': msg('speed:rapidSymbolMatching.kinds.sameDifferent'),
    'find-match': msg('speed:rapidSymbolMatching.kinds.findMatch'),
  },
  renderOption: renderSymbolOption,
  describeOption: describeSymbolOption,
});
