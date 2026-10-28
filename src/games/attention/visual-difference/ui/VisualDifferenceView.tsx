import { CellGrid, MultiSelectBoard } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName, markLabel } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import type { VisualDifferenceChallenge } from '../content/types';

const heading = 'mb-2 text-center text-xs font-semibold tracking-wide text-ink-muted uppercase';

export function VisualDifferenceView({
  challenge,
  respond,
  answer,
}: ContentViewProps<VisualDifferenceChallenge>) {
  const { left, right, columns } = challenge.content;
  const { response } = challenge;
  if (response.format !== 'multi-select') throw new Error('Visual Difference uses multi-select');
  const size = columns >= 4 ? 'sm' : 'md';
  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
      <section aria-label="Left picture">
        <h3 aria-hidden="true" className={heading}>
          Left
        </h3>
        <CellGrid
          label="Left picture"
          columns={columns}
          size={size}
          cells={left.map((m, i) => ({
            key: String(i),
            label: `left, ${cellName(i, columns)}, ${markLabel(m)}`,
            content: <MarkFace mark={m} />,
          }))}
        />
      </section>
      <section aria-label="Right picture">
        <h3 aria-hidden="true" className={heading}>
          Right — mark the differences
        </h3>
        <MultiSelectBoard
          response={response}
          label="Right picture"
          columns={columns}
          size={size}
          respond={respond}
          answer={answer}
          submitLabel="Check"
          cells={right.map((m, i) => ({
            key: String(i),
            label: `right, ${cellName(i, columns)}, ${markLabel(m)}`,
            content: <MarkFace mark={m} />,
          }))}
        />
      </section>
    </div>
  );
}
