import { glyphLabel } from '@/games/kit/content';
import { Glyph, TapStage } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import type { ReactionChallenge } from '../content/types';

export function ReactionView({ challenge, respond, answer }: ContentViewProps<ReactionChallenge>) {
  const { response, content } = challenge;
  if (response.format !== 'tap') throw new Error('Reaction Test uses the tap format');
  return (
    <div className="flex flex-col items-center gap-4">
      {content.kind !== 'simple' && (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          Go shape: <Glyph glyph={content.target} className="h-8 w-8" />
          <span className="font-medium text-ink">{glyphLabel(content.target)}</span>
        </p>
      )}
      <TapStage
        response={response}
        respond={respond}
        answer={answer}
        signalLabel={glyphLabel(content.stimulus)}
        waiting={
          <span aria-hidden="true" className="text-4xl text-ink-muted">
            +
          </span>
        }
        signal={<Glyph glyph={content.stimulus} decorative className="h-32 w-32 animate-pop" />}
      />
    </div>
  );
}
