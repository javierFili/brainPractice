import { defineGameModule } from '../../types';
import { renderNamedOption } from '../shared/ui/faces';
import { associationMemoryGame } from './content/definition';
import type { AssociationChallenge } from './content/types';
import { AssociationView } from './ui/AssociationView';

export const associationMemoryModule = defineGameModule<AssociationChallenge>({
  definition: associationMemoryGame,
  ContentView: AssociationView,
  kindLabels: {
    'object-color': 'Objects and colours',
    'glyph-object': 'Shapes and objects',
    'word-number': 'Words and numbers',
  },
  renderOption: renderNamedOption,
});
