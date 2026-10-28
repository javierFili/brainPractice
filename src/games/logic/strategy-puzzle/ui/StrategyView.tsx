import { CellGrid } from '@/games/kit/ui';
import { ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { PILE_NAMES } from '../content/definition';
import type { StrategyChallenge } from '../content/types';

function Coins({ count, label }: { readonly count: number; readonly label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-sm font-semibold text-ink">{label}</span>
      <span role="img" aria-label={`${label}: ${count} coins`} className="flex flex-wrap gap-1">
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
              ? `row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}: gap`
              : `row ${Math.floor(i / cols) + 1}, column ${(i % cols) + 1}: tile ${tile}`,
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
  const { content } = challenge;
  switch (content.kind) {
    case 'take-away':
      return (
        <div className="flex flex-col gap-4">
          <Panel title="Rules">
            <ClueList
              label="Rules"
              clues={[
                `On each turn, take 1 to ${content.maxTake} coins.`,
                'Whoever takes the last coin wins. Your friend always plays the best move.',
              ]}
            />
          </Panel>
          <Coins count={content.pile} label="Pile" />
        </div>
      );
    case 'piles':
      return (
        <div className="flex flex-col gap-4">
          <Panel title="Rules">
            <ClueList
              label="Rules"
              clues={[
                'On each turn, take any number of coins (at least one) from one pile.',
                'Whoever takes the last coin wins. Your friend always plays the best move.',
              ]}
            />
          </Panel>
          <div className="flex flex-col gap-2">
            {content.piles.map((count, i) => (
              <Coins key={i} count={count} label={`Pile ${PILE_NAMES[i] as string}`} />
            ))}
          </div>
        </div>
      );
    case 'jugs':
      return (
        <div className="flex flex-col gap-4">
          <Panel title="Rules">
            <ClueList
              label="Rules"
              clues={[
                ...(content.tap
                  ? ['Fill a jug to the top from the tap, or empty a jug completely.']
                  : ['There is no tap: you can only pour.']),
                'Pour one jug into another until the second is full or the first is empty.',
                `Goal: exactly ${content.target} ${content.target === 1 ? 'litre' : 'litres'} in any one jug.`,
              ]}
            />
          </Panel>
          <ul aria-label="Jugs" className="flex flex-wrap gap-3">
            {content.capacities.map((cap, i) => {
              const amount = content.start[i] as number;
              return (
                <li
                  key={i}
                  className="flex w-28 flex-col items-center gap-1 rounded-lg border border-line bg-raised p-2 text-center"
                >
                  <span className="text-sm font-semibold text-ink">{cap}-litre jug</span>
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
                    {amount === 0 ? 'empty' : amount === cap ? `full (${amount} L)` : `${amount} L`}
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
          <Panel title="Rules">
            <ClueList
              label="Rules"
              clues={[
                'Slide a tile that is next to the gap into the gap.',
                'Reach the goal picture.',
              ]}
            />
          </Panel>
          <div className="flex flex-wrap justify-around gap-4">
            <Panel title="Now">
              <Board board={content.start} cols={content.cols} label="Current board" />
            </Panel>
            <Panel title="Goal">
              <Board board={content.goal} cols={content.cols} label="Goal board" />
            </Panel>
          </div>
        </div>
      );
  }
}
