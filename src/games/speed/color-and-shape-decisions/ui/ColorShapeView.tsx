import { useTranslation } from 'react-i18next';
import { useText } from '@/i18n';
import { glyphLabel } from '@/games/kit/content';
import { Glyph } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import type { ColorShapeChallenge } from '../content/types';

/** The written cue on top and the shape to judge. The shape's name is its accessible label. */
export function ColorShapeView({ challenge, phase }: ContentViewProps<ColorShapeChallenge>) {
  const { t } = useTranslation('speed');
  const tx = useText();
  const { kind, glyph } = challenge.content;
  return (
    <div className="flex flex-col items-center gap-4">
      {kind === 'colour' ? (
        <p className="flex items-center gap-2 rounded-full border border-brand/60 bg-brand/10 px-4 py-1 text-base font-bold tracking-widest text-brand-strong">
          <span aria-hidden="true">◐</span> {t('colorAndShapeDecisions.view.cueColour')}
        </p>
      ) : (
        <p className="flex items-center gap-2 rounded-full border border-glow/60 bg-glow/10 px-4 py-1 text-base font-bold tracking-widest text-glow">
          <span aria-hidden="true">◇</span> {t('colorAndShapeDecisions.view.cueShape')}
        </p>
      )}
      <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-line bg-raised">
        <Glyph glyph={glyph} className="h-28 w-28" />
      </div>
      {phase === 'review' && (
        <p className="text-sm text-ink-soft">
          {t('colorAndShapeDecisions.view.itWas', { glyph: tx(glyphLabel(glyph)) })}
        </p>
      )}
    </div>
  );
}
