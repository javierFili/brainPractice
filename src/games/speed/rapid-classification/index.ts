import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { rapidClassificationGame } from './content/definition';
import type { RapidClassificationChallenge } from './content/types';
import { RapidClassificationView } from './ui/RapidClassificationView';

export const rapidClassificationModule = defineGameModule<RapidClassificationChallenge>({
  definition: rapidClassificationGame,
  ContentView: RapidClassificationView,
  kindLabels: {
    picture: msg('speed:rapidClassification.kinds.picture'),
    word: msg('speed:rapidClassification.kinds.word'),
    switch: msg('speed:rapidClassification.kinds.switch'),
  },
});
