import { defineGameModule } from '../../types';
import { sustainedAttentionGame } from './content/definition';
import type { SustainedAttentionChallenge } from './content/types';
import { SustainedAttentionView } from './ui/SustainedAttentionView';

export const sustainedAttentionModule = defineGameModule<SustainedAttentionChallenge>({
  definition: sustainedAttentionGame,
  ContentView: SustainedAttentionView,
  kindLabels: { single: 'Single target', sequence: 'Target after cue' },
});
