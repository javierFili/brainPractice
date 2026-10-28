import { defineGameModule } from '../../types';
import { targetTrackingGame } from './content/definition';
import type { TargetTrackingChallenge } from './content/types';
import { TargetTrackingView } from './ui/TargetTrackingView';

export const targetTrackingModule = defineGameModule<TargetTrackingChallenge>({
  definition: targetTrackingGame,
  ContentView: TargetTrackingView,
  kindLabels: { single: 'One card', double: 'Two cards' },
});
