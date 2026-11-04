import { useTranslation } from 'react-i18next';
import { joinText, msg } from '@/domain/shared';
import { CellGrid, type CellState } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { targetPositions } from '../content/definition';
import type { SustainedAttentionChallenge } from '../content/types';
import { StreamStage } from './StreamStage';

export function SustainedAttentionView({
  challenge,
  phase,
  respond,
  answer,
  assisted,
}: ContentViewProps<SustainedAttentionChallenge>) {
  const { t } = useTranslation('attention');
  const { content } = challenge;
  const rule =
    content.cue === null
      ? t('sustainedAttention.view.rule.single', { target: content.target })
      : t('sustainedAttention.view.rule.sequence', { target: content.target, cue: content.cue });
  if (phase !== 'review') {
    return (
      <StreamStage
        id={challenge.id}
        stream={content.stream}
        itemMs={assisted ? content.itemMs * 1.5 : content.itemMs}
        respond={phase === 'respond' ? respond : null}
        rule={rule}
      />
    );
  }
  const targets = new Set(targetPositions(content));
  const marks = new Set(answer?.format === 'multi-select' ? answer.indices : []);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-ink-soft">{t('sustainedAttention.view.legend')}</p>
      <CellGrid
        label={msg('attention:sustainedAttention.view.stream')}
        columns={8}
        size="sm"
        cells={content.stream.map((letter, i) => {
          const target = targets.has(i);
          const marked = marks.has(i);
          const state: CellState = target ? (marked ? 'hit' : 'missed') : marked ? 'wrong' : 'dim';
          return {
            key: String(i),
            label: joinText(
              [
                msg('attention:sustainedAttention.view.letter', { position: i + 1, letter }),
                ...(target ? [msg('attention:sustainedAttention.view.target')] : []),
                ...(marked ? [msg('attention:sustainedAttention.view.pressed')] : []),
              ],
              ', ',
            ),
            content: <span className="font-mono font-bold text-ink">{letter}</span>,
            state,
          };
        })}
      />
    </div>
  );
}
