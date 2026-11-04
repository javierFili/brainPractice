import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { renderNamedOption } from '../shared/ui/faces';
import { associationMemoryGame } from './content/definition';
import type { AssociationChallenge } from './content/types';
import { AssociationView } from './ui/AssociationView';

export const associationMemoryModule = defineGameModule<AssociationChallenge>({
  definition: associationMemoryGame,
  ContentView: AssociationView,
  kindLabels: {
    'object-color': msg('memory:associationMemory.kinds.objectColor'),
    'glyph-object': msg('memory:associationMemory.kinds.glyphObject'),
    'word-number': msg('memory:associationMemory.kinds.wordNumber'),
  },
  renderOption: renderNamedOption,
});
