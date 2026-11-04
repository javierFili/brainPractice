import { msg } from '@/domain/shared';
import { defineGameModule } from '../../types';
import { describePatternOption, renderPatternOption } from '../shared/ui';
import { spatialTransformGame } from './content/definition';
import type { SpatialTransformChallenge } from './content/types';
import { SpatialTransformView } from './ui/SpatialTransformView';

export const spatialTransformModule = defineGameModule<SpatialTransformChallenge>({
  definition: spatialTransformGame,
  ContentView: SpatialTransformView,
  kindLabels: {
    single: msg('patterns:spatialTransformation.kinds.single'),
    double: msg('patterns:spatialTransformation.kinds.double'),
  },
  renderOption: renderPatternOption,
  describeOption: describePatternOption,
});
