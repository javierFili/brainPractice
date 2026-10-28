import { Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { describeClaim } from '../content/solver';
import type { TruthChallenge } from '../content/types';

export function TruthView({ challenge, phase }: ContentViewProps<TruthChallenge>) {
  const { names, claims, solution } = challenge.content;
  return (
    <Panel title="What they say">
      <ul aria-label="Statements" className="flex flex-col gap-2">
        {claims.map((claim, i) => (
          <li
            key={names[i]}
            className="flex flex-col gap-1 rounded-lg border border-line bg-raised p-3 sm:flex-row sm:items-baseline sm:gap-3"
          >
            <span className="font-semibold text-ink">
              {names[i]}
              {phase === 'review' && (
                <span className="ml-2 text-xs font-normal text-ink-muted">
                  ({solution[i] ? 'truth-teller' : 'liar'})
                </span>
              )}
              <span className="sr-only"> says:</span>
            </span>
            <q className="text-ink-soft">{describeClaim(claim, i, names)}</q>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
