import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { changeDetectionGame } from './content/definition';
import type { ChangeDetectionChallenge } from './content/types';
import { ChangeDetectionView } from './ui/ChangeDetectionView';

export const changeDetectionModule = defineGameModule<ChangeDetectionChallenge>({
  definition: changeDetectionGame,
  ContentView: ChangeDetectionView,
  kindLabels: {
    none: msg('attention:changeDetection.kinds.none'),
    appear: msg('attention:changeDetection.kinds.appear'),
    move: msg('attention:changeDetection.kinds.move'),
    color: msg('attention:changeDetection.kinds.color'),
    shape: msg('attention:changeDetection.kinds.shape'),
    turn: msg('attention:changeDetection.kinds.turn'),
  },
});
