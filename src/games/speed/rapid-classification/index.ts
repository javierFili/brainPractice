import { defineGameModule } from '../../types';
import { rapidClassificationGame } from './content/definition';
import type { RapidClassificationChallenge } from './content/types';
import { RapidClassificationView } from './ui/RapidClassificationView';

export const rapidClassificationModule = defineGameModule<RapidClassificationChallenge>({
  definition: rapidClassificationGame,
  ContentView: RapidClassificationView,
  kindLabels: { picture: 'Pictures', word: 'Words only', switch: 'Cued rule switch' },
});
