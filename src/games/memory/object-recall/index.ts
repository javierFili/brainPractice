import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { objectRecallGame } from './content/definition';
import type { ObjectRecallChallenge } from './content/types';
import { ObjectRecallView } from './ui/ObjectRecallView';

export const objectRecallModule = defineGameModule<ObjectRecallChallenge>({
  definition: objectRecallGame,
  ContentView: ObjectRecallView,
  kindLabels: {
    mixed: msg('memory:objectRecall.kinds.mixed'),
    family: msg('memory:objectRecall.kinds.family'),
  },
});
