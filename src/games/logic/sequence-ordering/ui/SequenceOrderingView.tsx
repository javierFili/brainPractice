import { Chips, ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { describeClue } from '../content/solver';
import type { OrderingChallenge } from '../content/types';

export function SequenceOrderingView({ challenge, phase }: ContentViewProps<OrderingChallenge>) {
  const { content } = challenge;
  return (
    <div className="flex flex-col gap-4">
      <Panel title={content.kind === 'race' ? 'Runners' : 'People in the line'}>
        <Chips items={content.entities} label="Names" />
      </Panel>
      <Panel title="Clues · all of them are true">
        <ClueList label="Clues" clues={content.clues.map((clue) => describeClue(clue, content))} />
      </Panel>
      {phase === 'review' && (
        <Panel title="Correct order">
          <ol aria-label="Correct order" className="flex flex-wrap gap-2 text-sm text-ink">
            {content.solution.map((name, i) => (
              <li
                key={name}
                className="rounded-md border border-success/60 bg-success/10 px-2 py-1"
              >
                {i + 1}. {name}
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
