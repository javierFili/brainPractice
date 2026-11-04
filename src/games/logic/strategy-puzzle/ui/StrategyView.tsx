import { useTranslation } from 'react-i18next';
import { msg } from '@/domain/shared';
import { cellLabel } from '@/games/kit/content';
import { CellGrid } from '@/games/kit/ui';
import { ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { PILE_NAMES } from '../content/definition';
import type { StrategyChallenge } from '../content/types';

function Coins({ count, label }: { readonly count: number; readonly label: string }) {
  const { t } = useTranslation('logic');
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm font-semibold text-ink">{label}</span>
      <span
        role="img"
        aria-label={t('strategyPuzzle.view.coins', { label, count })}
        className="flex flex-wrap gap-1"
      >
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className="h-5 w-5 rounded-full border-2 border-glow bg-glow/30" />
        ))}
      </span>
      <span aria-hidden="true" className="font-mono text-sm text-ink-muted">
        {count}
      </span>
    </div>
  );
}

function Board({
  board,
  cols,
  label,
}: {
  readonly board: readonly number[];
  readonly cols: number;
  readonly label: string;
}) {
  return (
    <div className="w-full max-w-48">
      <CellGrid
        label={label}
        columns={cols}
        size="sm"
        cells={board.map((tile, i) => ({
          key: String(i),
          label:
            tile === 0
              ? msg('logic:strategyPuzzle.view.gap', {
                  cell: cellLabel(Math.floor(i / cols), i % cols),
                })
              : msg('logic:strategyPuzzle.view.tile', {
                  cell: cellLabel(Math.floor(i / cols), i % cols),
                  tile,
                }),
          content:
            tile === 0 ? null : (
              <span className="font-mono text-xl font-bold text-ink">{tile}</span>
            ),
          state: tile === 0 ? 'dim' : 'idle',
        }))}
      />
    </div>
  );
}

export function StrategyView({ challenge }: ContentViewProps<StrategyChallenge>) {
  const { t } = useTranslation('logic');
  const { content } = challenge;
  const R = (path: string, values?: Record<string, number>) =>
    msg(`logic:strategyPuzzle.rules.${path}`, values);
  switch (content.kind) {
    case 'take-away':
      return (
        <div className="flex flex-col gap-4">
          <Panel title={t('shared.rules')}>
            <ClueList
              label={t('shared.rules')}
              clues={[R('takeAway', { max: content.maxTake }), R('lastCoin')]}
            />
          </Panel>
          <Coins count={content.pile} label={t('strategyPuzzle.view.pile')} />
        </div>
      );
    case 'piles':
      return (
        <div className="flex flex-col gap-4">
          <Panel title={t('shared.rules')}>
            <ClueList label={t('shared.rules')} clues={[R('piles'), R('lastCoin')]} />
          </Panel>
          <div className="flex flex-col gap-2">
            {content.piles.map((count, i) => (
              <Coins
                key={i}
                count={count}
                label={t('strategyPuzzle.view.namedPile', { name: PILE_NAMES[i] })}
              />
            ))}
          </div>
        </div>
      );
    case 'jugs':
      return (
        <div className="flex flex-col gap-4">
          <Panel title={t('shared.rules')}>
            <ClueList
              label={t('shared.rules')}
              clues={[
                R(content.tap ? 'tap' : 'noTap'),
                R('pour'),
                R('goal', { count: content.target }),
              ]}
            />
          </Panel>
          <ul aria-label={t('strategyPuzzle.view.jugs')} className="flex flex-wrap gap-3">
            {content.capacities.map((cap, i) => {
              const amount = content.start[i] as number;
              return (
                <li
                  key={i}
                  className="flex w-28 flex-col items-center gap-1 rounded-lg border border-line bg-raised p-2 text-center"
                >
                  <span className="text-sm font-semibold text-ink">
                    {t('strategyPuzzle.view.jug', { cap })}
                  </span>
                  <span
                    aria-hidden="true"
                    className="relative h-16 w-10 overflow-hidden rounded-b-md border-2 border-ink-muted"
                  >
                    <span
                      className="absolute right-0 bottom-0 left-0 bg-glyph-blue/70"
                      style={{ height: `${(amount / cap) * 100}%` }}
                    />
                  </span>
                  <span className="text-xs text-ink-soft">
                    {amount === 0
                      ? t('strategyPuzzle.view.empty')
                      : amount === cap
                        ? t('strategyPuzzle.view.full', { amount })
                        : t('strategyPuzzle.view.litres', { amount })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    case 'sliding':
      return (
        <div className="flex flex-col gap-4">
          <Panel title={t('shared.rules')}>
            <ClueList label={t('shared.rules')} clues={[R('slide'), R('reach')]} />
          </Panel>
          <div className="flex flex-wrap justify-around gap-4">
            <Panel title={t('strategyPuzzle.view.now')}>
              <Board
                board={content.start}
                cols={content.cols}
                label={t('strategyPuzzle.view.currentBoard')}
              />
            </Panel>
            <Panel title={t('strategyPuzzle.view.goal')}>
              <Board
                board={content.goal}
                cols={content.cols}
                label={t('strategyPuzzle.view.goalBoard')}
              />
            </Panel>
          </div>
        </div>
      );
  }
}
