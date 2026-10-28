import { defineGameModule } from '../../types';
import { changeDetectionGame } from './content/definition';
import type { ChangeDetectionChallenge } from './content/types';
import { ChangeDetectionView } from './ui/ChangeDetectionView';

export const changeDetectionModule = defineGameModule<ChangeDetectionChallenge>({
  definition: changeDetectionGame,
  ContentView: ChangeDetectionView,
  kindLabels: {
    none: 'No change',
    appear: 'Item appeared or vanished',
    move: 'Item moved',
    color: 'Colour change',
    shape: 'Shape change',
    turn: 'Turned item',
  },
});
