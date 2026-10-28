import { defineGameModule } from '../../types';
import { rapidSymbolMatchingGame } from './content/definition';
import type { SymbolMatchChallenge } from './content/types';
import { describeSymbolOption, renderSymbolOption } from './ui/symbolOptions';
import { SymbolMatchView } from './ui/SymbolMatchView';

export const rapidSymbolMatchingModule = defineGameModule<SymbolMatchChallenge>({
  definition: rapidSymbolMatchingGame,
  ContentView: SymbolMatchView,
  kindLabels: { 'same-different': 'Same or different', 'find-match': 'Find the copy' },
  renderOption: renderSymbolOption,
  describeOption: describeSymbolOption,
});
