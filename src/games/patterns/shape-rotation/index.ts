import { defineGameModule } from '../../types';
import { describePatternOption, renderPatternOption } from '../shared/ui';
import { shapeRotationGame } from './content/definition';
import type { ShapeRotationChallenge } from './content/types';
import { ShapeRotationView } from './ui/ShapeRotationView';

export const shapeRotationModule = defineGameModule<ShapeRotationChallenge>({
  definition: shapeRotationGame,
  ContentView: ShapeRotationView,
  kindLabels: { pieces: 'Different pieces', mirrors: 'Turns versus mirror images' },
  renderOption: renderPatternOption,
  describeOption: describePatternOption,
});
