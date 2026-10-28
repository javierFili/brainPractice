import { defineGameModule } from '../../types';
import { describePatternOption, renderPatternOption } from '../shared/ui';
import { spatialTransformGame } from './content/definition';
import type { SpatialTransformChallenge } from './content/types';
import { SpatialTransformView } from './ui/SpatialTransformView';

export const spatialTransformModule = defineGameModule<SpatialTransformChallenge>({
  definition: spatialTransformGame,
  ContentView: SpatialTransformView,
  kindLabels: { single: 'One move', double: 'Two moves in a row' },
  renderOption: renderPatternOption,
  describeOption: describePatternOption,
});
