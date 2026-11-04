import { useTranslation } from 'react-i18next';
import { msg } from '@/domain/shared';
import { useText } from '@/i18n';
import { Glyph } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { sequenceLabel } from '../content/definition';
import type { FastSequenceChallenge } from '../content/types';

function Row({ challenge }: { readonly challenge: FastSequenceChallenge }) {
  const tx = useText();
  const { kind, items, glyphs } = challenge.content;
  return (
    <ol
      aria-label={tx(
        msg('speed:fastSequenceRecognition.view.sequence', {
          sequence: sequenceLabel(kind, items, glyphs),
        }),
      )}
      className="flex flex-wrap justify-center gap-1.5 sm:gap-2"
    >
      {items.map((id, i) => {
        const glyph = glyphs[id];
        return (
          <li
            key={`${id}-${i}`}
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-raised font-mono text-2xl font-semibold text-ink sm:h-14 sm:w-14 sm:text-3xl"
          >
            {glyph === undefined ? (
              id
            ) : (
              <Glyph glyph={glyph} decorative className="h-8 w-8 sm:h-10 sm:w-10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Study: the whole sequence at once (one still display). Respond: hidden. Review: shown again. */
export function FastSequenceView({ challenge, phase }: ContentViewProps<FastSequenceChallenge>) {
  const { t } = useTranslation('speed');
  if (phase === 'respond') {
    return (
      <p className="text-center text-ink-soft">
        {t('fastSequenceRecognition.view.hidden', { count: challenge.content.items.length })}
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      {phase === 'review' && (
        <p className="text-sm text-ink-muted">{t('fastSequenceRecognition.view.youSaw')}</p>
      )}
      <div aria-live={phase === 'study' ? 'assertive' : undefined}>
        <Row challenge={challenge} />
      </div>
    </div>
  );
}
