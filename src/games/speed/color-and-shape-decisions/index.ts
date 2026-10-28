import { defineGameModule } from '../../types';
import { colorAndShapeGame } from './content/definition';
import type { ColorShapeChallenge } from './content/types';
import { renderColorShapeOption } from './ui/colorShapeOptions';
import { ColorShapeView } from './ui/ColorShapeView';

export const colorAndShapeDecisionsModule = defineGameModule<ColorShapeChallenge>({
  definition: colorAndShapeGame,
  ContentView: ColorShapeView,
  kindLabels: { colour: 'Colour cue', shape: 'Shape cue' },
  renderOption: renderColorShapeOption,
});
