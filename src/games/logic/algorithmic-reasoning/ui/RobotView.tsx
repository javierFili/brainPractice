import { useTranslation } from 'react-i18next';
import { msg } from '@/domain/shared';
import { CellGrid, type CellState } from '@/games/kit/ui';
import { Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { useText } from '@/i18n';
import { cellLabel, describeProgram, facingLabel } from '../content/robot';
import type { RobotChallenge } from '../content/types';

const ARROWS = ['↑', '→', '↓', '←'] as const;

function Wall() {
  return (
    <span
      aria-hidden="true"
      className="h-full w-full rounded-md bg-ink-muted/40"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent 0 5px, rgb(0 0 0 / 0.35) 5px 9px)',
      }}
    />
  );
}

export function RobotView({ challenge, phase, locate }: ContentViewProps<RobotChallenge>) {
  const { t } = useTranslation('logic');
  const tx = useText();
  const { size, walls, start, program } = challenge.content;
  const lines = describeProgram(program);
  const solution = phase === 'review' ? (locate?.solutionIndex ?? null) : null;
  const picked = locate?.selectedIndex ?? null;
  const interactive = locate !== null && !locate.disabled;
  const stateOf = (i: number): CellState => {
    if (solution !== null) {
      if (i === solution) return picked === solution ? 'hit' : 'missed';
      if (i === picked) return 'wrong';
    }
    if (walls.includes(i)) return 'dim';
    return i === start.cell ? 'highlight' : 'idle';
  };
  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <Panel title={t('algorithmicReasoning.view.instructions')}>
        <ol
          aria-label={t('algorithmicReasoning.view.instructions')}
          className="flex flex-col gap-1 rounded-lg border border-line bg-raised p-3 text-sm text-ink sm:text-base"
        >
          {lines.map((line, i) => (
            <li
              key={i}
              className={
                line.depth === 0
                  ? ''
                  : line.depth === 1
                    ? 'border-l-2 border-brand/50 pl-4'
                    : 'ml-4 border-l-2 border-brand/50 pl-4'
              }
            >
              <span className="mr-2 text-xs text-ink-muted">{i + 1}.</span>
              {tx(line.text)}
            </li>
          ))}
        </ol>
      </Panel>
      <div className="w-full max-w-md min-w-0 lg:flex-1">
        <CellGrid
          label={t('algorithmicReasoning.view.grid')}
          columns={size}
          size="sm"
          disabled={!interactive}
          {...(locate
            ? {
                onPress: (i: number) => {
                  locate.onLocate(i);
                },
              }
            : {})}
          cells={Array.from({ length: size * size }, (_, i) => {
            const isWall = walls.includes(i);
            const isStart = i === start.cell;
            const cell = cellLabel(i, size);
            return {
              key: String(i),
              label: isWall
                ? msg('logic:algorithmicReasoning.view.wall', { cell })
                : isStart
                  ? msg('logic:algorithmicReasoning.view.start', {
                      cell,
                      facing: facingLabel(start.facing),
                    })
                  : cell,
              state: stateOf(i),
              content: isWall ? (
                <Wall />
              ) : isStart ? (
                <span aria-hidden="true" className="text-2xl font-bold text-glow">
                  {ARROWS[start.facing]}
                </span>
              ) : null,
            };
          })}
        />
      </div>
    </div>
  );
}
