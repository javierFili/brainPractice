import { defineGameModule } from '../../types';
import { mentalArithmeticSprintGame } from './content/definition';
import type { ArithmeticChallenge } from './content/types';
import { ArithmeticView } from './ui/ArithmeticView';

export const mentalArithmeticSprintModule = defineGameModule<ArithmeticChallenge>({
  definition: mentalArithmeticSprintGame,
  ContentView: ArithmeticView,
  kindLabels: { verify: 'True or false', solve: 'Type the result' },
});
