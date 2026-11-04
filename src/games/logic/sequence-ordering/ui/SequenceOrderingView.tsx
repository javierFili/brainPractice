import { useTranslation } from 'react-i18next';
import { Chips, ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { describeClue } from '../content/solver';
import type { OrderingChallenge } from '../content/types';

export function SequenceOrderingView({ challenge, phase }: ContentViewProps<OrderingChallenge>) {
  const { t } = useTranslation('logic');
  const { content } = challenge;
  return (
    <div className="flex flex-col gap-4">
      <Panel title={t(`sequenceOrdering.view.entities.${content.kind}`)}>
        <Chips items={content.entities} label={t('sequenceOrdering.view.names')} />
      </Panel>
      <Panel title={t('shared.cluesTitle')}>
        <ClueList
          label={t('shared.clues')}
          clues={content.clues.map((clue) => describeClue(clue, content))}
        />
      </Panel>
      {phase === 'review' && (
        <Panel title={t('sequenceOrdering.view.correctOrder')}>
          <ol
            aria-label={t('sequenceOrdering.view.correctOrder')}
            className="flex flex-wrap gap-2 text-sm text-ink"
          >
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
