import type { ContentViewProps } from '@/games/types';
import { ProgramPanel } from '../../shared/ui';
import type { TrackingChallenge } from '../content/types';

export function VariableTrackingView({ challenge, phase }: ContentViewProps<TrackingChallenge>) {
  const { source, line, ask, variables } = challenge.content;
  return (
    <ProgramPanel
      source={source}
      phase={phase}
      label="Program to trace"
      {...(line === null ? {} : { highlight: [line] })}
      caption={
        ask === null
          ? `Compare ${variables.join(', ')} after the last line.`
          : line === null
            ? `Track ${ask} to the last line.`
            : `Stop right after line ${line} (highlighted).`
      }
    />
  );
}
