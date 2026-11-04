import { CellGrid, MultiSelectBoard } from '@/games/kit/ui';
import { msg } from '@/domain/shared';
import type { ContentViewProps } from '@/games/types';
import { cellName, describeGrid } from '../../shared/content';
import { TileGridFigure } from '../../shared/ui';
import { fillCellName } from '../content/definition';
import type { SymmetryChallenge } from '../content/types';

function Filled() {
  return <span aria-hidden="true" className="h-3/4 w-3/4 rounded-md bg-glyph-blue" />;
}

export function SymmetryView({ challenge, respond, answer }: ContentViewProps<SymmetryChallenge>) {
  const { content, response } = challenge;
  if (content.kind === 'classify') {
    return (
      <div className="flex justify-center">
        <TileGridFigure
          grid={content.grid}
          label={msg('patterns:symmetryRecognition.view.pattern', {
            grid: describeGrid(content.grid),
          })}
          className="w-52 sm:w-64"
        />
      </div>
    );
  }
  if (response.format !== 'multi-select') throw new Error('Completing a mirror uses multi-select');
  const { axis, given } = content;
  const rows = given.length;
  const cols = given[0]?.length ?? 0;
  const vertical = axis === 'vertical';
  const givenGrid = (
    <div className="min-w-0 flex-1">
      <CellGrid
        label={msg(`patterns:symmetryRecognition.view.given.${axis}`)}
        columns={cols}
        size="sm"
        cells={given.flat().map((v, i) => ({
          key: String(i),
          label: msg(`patterns:symmetryRecognition.view.${v > 0 ? 'filled' : 'empty'}`, {
            cell: cellName(Math.floor(i / cols), i % cols),
          }),
          content: v > 0 ? <Filled /> : null,
        }))}
      />
    </div>
  );
  const board = (
    <div className="min-w-0 flex-1">
      <MultiSelectBoard
        response={response}
        label={msg(`patterns:symmetryRecognition.view.fill.${axis}`)}
        columns={cols}
        size="sm"
        respond={respond}
        answer={answer}
        submitLabel={msg('kit:board.check')}
        cells={Array.from({ length: rows * cols }, (_, i) => ({
          key: String(i),
          label: fillCellName(given, axis, i),
        }))}
      />
    </div>
  );
  return vertical ? (
    <div className="flex items-start gap-2">
      {givenGrid}
      <div
        role="presentation"
        aria-hidden="true"
        className="w-0 self-stretch border-l-2 border-dashed border-glow"
      />
      {board}
    </div>
  ) : (
    <div className="mx-auto flex max-w-sm flex-col gap-2">
      {givenGrid}
      <div
        role="presentation"
        aria-hidden="true"
        className="h-0 border-t-2 border-dashed border-glow"
      />
      {board}
    </div>
  );
}
