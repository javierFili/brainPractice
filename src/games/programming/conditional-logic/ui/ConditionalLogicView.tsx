import type { ContentViewProps } from '@/games/types';
import { ProgramPanel } from '../../shared/ui';
import type { ConditionalChallenge } from '../content/types';

export function ConditionalLogicView({ challenge, phase }: ContentViewProps<ConditionalChallenge>) {
  const { source, inputs, target, kind } = challenge.content;
  const inputCount = inputs === null ? 0 : Object.keys(inputs).length;
  return (
    <ProgramPanel
      source={source}
      phase={phase}
      label="Program with conditions"
      caption={
        target !== null
          ? `The inputs come from the options. Which one makes it print ${target}?`
          : kind === 'short-circuit'
            ? `Lines 1–${inputCount} set the inputs. Dividing by zero stops the program with an error.`
            : `Lines 1–${inputCount} set the inputs.`
      }
      // For find-input the trace would need a chosen input; the explanation covers it instead.
      trace={inputs !== null}
    />
  );
}
