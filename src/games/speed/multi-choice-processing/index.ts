import { defineGameModule } from '../../types';
import { multiChoiceProcessingGame } from './content/definition';
import type { FlankerChallenge } from './content/types';
import { renderDirectionOption } from './ui/directionOptions';
import { FlankerView } from './ui/FlankerView';

export const multiChoiceProcessingModule = defineGameModule<FlankerChallenge>({
  definition: multiChoiceProcessingGame,
  ContentView: FlankerView,
  kindLabels: { single: 'Single arrow', flanker: 'Centre arrow', cued: 'Cued rule' },
  renderOption: renderDirectionOption,
});
