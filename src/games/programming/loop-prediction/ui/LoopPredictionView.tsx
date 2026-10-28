import type { ContentViewProps } from '@/games/types';
import { ProgramPanel } from '../../shared/ui';
import type { LoopChallenge } from '../content/types';

export function LoopPredictionView({ challenge, phase }: ContentViewProps<LoopChallenge>) {
  const { source, line, ask, kind } = challenge.content;
  return (
    <ProgramPanel
      source={source}
      phase={phase}
      label="Program with loops"
      {...(line === null ? {} : { highlight: [line] })}
      caption={
        kind === 'iterations'
          ? `Count every time line ${line ?? ''} (highlighted) runs, across all turns.`
          : kind === 'final-value'
            ? `Follow ${ask ?? 'the variable'} through every turn.`
            : 'Each print adds one value to the output.'
      }
    />
  );
}
