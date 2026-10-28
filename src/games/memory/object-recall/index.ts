import { defineGameModule } from '../../types';
import { objectRecallGame } from './content/definition';
import type { ObjectRecallChallenge } from './content/types';
import { ObjectRecallView } from './ui/ObjectRecallView';

export const objectRecallModule = defineGameModule<ObjectRecallChallenge>({
  definition: objectRecallGame,
  ContentView: ObjectRecallView,
  kindLabels: { mixed: 'Objects of any kind', family: 'Look-alike families' },
});
