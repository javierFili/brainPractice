import { useTranslation } from 'react-i18next';
import { msg, type Text } from '@/domain/shared';
import { useText } from '@/i18n';
import { cellLabelAt, glyphLabel } from '@/games/kit/content';
import { CellGrid, Glyph, type CellState } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import type { VisualSearchChallenge } from '../content/types';

/** The target as a reference, then the grid; each cell is a button while answering. */
export function VisualSearchView({
  challenge,
  phase,
  locate,
  answer,
}: ContentViewProps<VisualSearchChallenge>) {
  const { t } = useTranslation('speed');
  const tx = useText();
  const { target, cells, columns } = challenge.content;
  const review = phase === 'review';
  const solution =
    challenge.response.format === 'locate' ? challenge.response.solution.index : null;
  const pick = answer?.format === 'locate' ? answer.index : (locate?.selectedIndex ?? null);

  const cellName = (index: number, glyph: (typeof cells)[number]): Text => {
    const values = { cell: cellLabelAt(index, columns), glyph: glyphLabel(glyph) };
    if (review && index === solution)
      return msg('speed:visualSearchSprint.view.cellTarget', values);
    if (review && index === pick) return msg('speed:visualSearchSprint.view.cellPick', values);
    return msg('speed:visualSearchSprint.view.cell', values);
  };

  const stateOf = (index: number): CellState => {
    if (!review) return 'idle';
    if (index === solution) return 'hit';
    if (index === pick) return 'wrong';
    return 'dim';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        {t('visualSearchSprint.view.find')}
        <Glyph glyph={target} decorative className="h-9 w-9" />
        <span className="font-medium text-ink">{tx(glyphLabel(target))}</span>
      </p>
      <CellGrid
        label={msg('speed:visualSearchSprint.view.grid', { count: cells.length })}
        columns={columns}
        size={cells.length > 16 ? 'sm' : 'md'}
        cells={cells.map((glyph, i) => ({
          key: String(i),
          label: cellName(i, glyph),
          content: <Glyph glyph={glyph} decorative className="h-3/5 w-3/5" />,
          state: stateOf(i),
        }))}
        {...(locate !== null
          ? {
              onPress: (index: number) => {
                locate.onLocate(index);
              },
              disabled: locate.disabled,
            }
          : {})}
      />
    </div>
  );
}
