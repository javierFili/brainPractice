import { useTranslation } from 'react-i18next';
import { textId } from '@/domain/shared';
import { Glyph, ObjectFace } from '@/games/kit/ui';
import { useText } from '@/i18n';
import type { ContentViewProps } from '@/games/types';
import { objectById } from '../../shared/content';
import { itemLabel } from '../content/definition';
import type { AssocItem, AssociationChallenge } from '../content/types';

/** Picture plus the item's name: colour and shape are always named in text too. */
function ItemFace({ item }: { readonly item: AssocItem }) {
  const tx = useText();
  const label = tx(itemLabel(item));
  const picture =
    item.type === 'object' ? (
      <ObjectFace item={objectById(item.id)} className="text-3xl" />
    ) : item.type === 'color' ? (
      <Glyph glyph={{ shape: 'circle', color: item.color }} decorative className="h-8 w-8" />
    ) : item.type === 'glyph' ? (
      <Glyph glyph={item.glyph} decorative className="h-9 w-9" />
    ) : null;
  return (
    <span className="flex min-w-0 items-center gap-2">
      {picture}
      <span
        className={
          item.type === 'number'
            ? 'font-mono text-2xl font-semibold text-ink'
            : item.type === 'word'
              ? 'text-lg font-medium text-ink'
              : 'text-sm text-ink-soft'
        }
      >
        {label}
      </span>
    </span>
  );
}

export function AssociationView({ challenge, phase }: ContentViewProps<AssociationChallenge>) {
  const { t } = useTranslation('memory');
  const tx = useText();
  const { pairs, ask } = challenge.content;
  if (phase === 'respond') {
    const asked = pairs[ask.pair];
    if (!asked) return null;
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-ink-muted">{t('associationMemory.view.whatWent')}</p>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-raised px-4 py-3">
          <ItemFace item={ask.reversed ? asked.partner : asked.cue} />
          <span aria-hidden="true" className="text-ink-muted">
            — ?
          </span>
        </div>
      </div>
    );
  }
  return (
    <ul
      aria-label={t('associationMemory.view.pairs')}
      className="mx-auto flex w-full max-w-md flex-col gap-2"
    >
      {pairs.map((pair, i) => {
        const highlighted = phase === 'review' && i === ask.pair;
        return (
          <li
            key={`${textId(itemLabel(pair.cue))}-${textId(itemLabel(pair.partner))}`}
            aria-label={t(
              highlighted ? 'associationMemory.view.pairAsked' : 'associationMemory.view.pair',
              {
                cue: tx(itemLabel(pair.cue)),
                partner: tx(itemLabel(pair.partner)),
              },
            )}
            className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border px-3 py-2 ${highlighted ? 'border-brand bg-brand/10' : 'border-line bg-raised'}`}
          >
            <span aria-hidden="true" className="justify-self-end">
              <ItemFace item={pair.cue} />
            </span>
            <span aria-hidden="true" className="text-ink-muted">
              ↔
            </span>
            <span aria-hidden="true">
              <ItemFace item={pair.partner} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
