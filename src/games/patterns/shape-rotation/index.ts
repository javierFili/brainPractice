import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { describePatternOption, renderPatternOption } from '../shared/ui';
import { shapeRotationGame } from './content/definition';
import type { ShapeRotationChallenge } from './content/types';
import { ShapeRotationView } from './ui/ShapeRotationView';

export const shapeRotationModule = defineGameModule<ShapeRotationChallenge>({
  definition: shapeRotationGame,
  ContentView: ShapeRotationView,
  kindLabels: {
    pieces: msg('patterns:shapeRotation.kinds.pieces'),
    mirrors: msg('patterns:shapeRotation.kinds.mirrors'),
  },
  renderOption: renderPatternOption,
  describeOption: describePatternOption,
});
