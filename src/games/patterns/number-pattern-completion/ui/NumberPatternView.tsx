import type { ContentViewProps } from '@/games/types';
import type { NumberCross, NumberPatternChallenge } from '../content/types';

const CELL =
  'flex h-12 min-w-12 items-center justify-center rounded-lg border px-1 font-mono text-lg font-semibold sm:h-14 sm:min-w-14';

function NumberCell({ value, blank = false }: { value: number | null; blank?: boolean }) {
  if (value !== null)
    return <span className={`${CELL} border-line bg-raised text-ink`}>{value}</span>;
  if (blank)
    return (
      <span className={`${CELL} border-line border-dashed bg-surface text-ink-muted`}>
        <span aria-hidden="true">…</span>
        <span className="sr-only">blank</span>
      </span>
    );
  return (
    <span className={`${CELL} border-2 border-dashed border-glow/70 bg-glow/10 text-glow`}>
      <span aria-hidden="true">?</span>
      <span className="sr-only">missing number</span>
    </span>
  );
}

function GridLayout({ cells }: { cells: readonly (readonly (number | null)[])[] }) {
  return (
    <table className="mx-auto border-separate border-spacing-1.5">
      <caption className="sr-only">
        Number grid, 3 rows by 3 columns, with one missing number
      </caption>
      <tbody>
        {cells.map((row, r) => (
          <tr key={r}>
            {row.map((v, c) => (
              <td key={c}>
                <NumberCell value={v} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PyramidLayout({
  rows,
  ask,
}: {
  rows: readonly (readonly (number | null)[])[];
  ask: readonly [number, number];
}) {
  return (
    <ol
      aria-label="Number pyramid, from the top brick down"
      className="flex flex-col items-center gap-1.5"
    >
      {rows.map((row, r) => (
        <li key={r}>
          <ol aria-label={`Row ${r + 1} from the top`} className="flex gap-1.5">
            {row.map((v, i) => (
              <li key={i}>
                <NumberCell value={v} blank={v === null && (ask[0] !== r || ask[1] !== i)} />
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

function WheelLayout({ segments }: { segments: readonly (number | null)[] }) {
  const n = segments.length;
  const point = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [100 + radius * Math.cos(rad), 100 + radius * Math.sin(rad)] as const;
  };
  return (
    <figure className="mx-auto w-full max-w-64">
      <svg viewBox="0 0 200 200" aria-hidden="true" className="w-full">
        <circle
          cx={100}
          cy={100}
          r={94}
          className="fill-raised stroke-line-strong"
          strokeWidth={2}
        />
        {segments.map((_, i) => {
          const [x, y] = point((i + 0.5) * (360 / n), 94);
          return (
            <line
              key={i}
              x1={100}
              y1={100}
              x2={x}
              y2={y}
              className="stroke-line-strong"
              strokeWidth={2}
            />
          );
        })}
        <circle
          cx={100}
          cy={100}
          r={18}
          className="fill-surface stroke-line-strong"
          strokeWidth={2}
        />
        {segments.map((v, i) => {
          const [x, y] = point(i * (360 / n), 62);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className={
                v === null
                  ? 'fill-glow font-mono text-[22px] font-bold'
                  : 'fill-ink font-mono text-[20px] font-semibold'
              }
            >
              {v ?? '?'}
            </text>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        Wheel with {n} segments, clockwise from the top:{' '}
        {segments.map((v) => (v === null ? 'missing' : String(v))).join(', ')}. Segment 1 is
        opposite segment {n / 2 + 1}.
      </figcaption>
    </figure>
  );
}

function CrossFigure({ cross, index }: { cross: NumberCross; index: number }) {
  const { top, right, bottom, left, centre } = cross;
  const words = `Cross ${index + 1}: top ${top}, right ${right}, bottom ${bottom}, left ${left}, centre ${centre ?? 'missing'}`;
  return (
    <li aria-label={words} className="rounded-xl border border-line bg-surface p-1.5">
      <div aria-hidden="true" className="grid grid-cols-3 gap-1">
        <span />
        <NumberCell value={top} />
        <span />
        <NumberCell value={left} />
        <NumberCell value={centre} />
        <NumberCell value={right} />
        <span />
        <NumberCell value={bottom} />
        <span />
      </div>
    </li>
  );
}

export function NumberPatternView({ challenge }: ContentViewProps<NumberPatternChallenge>) {
  const { content } = challenge;
  switch (content.kind) {
    case 'grid':
      return <GridLayout cells={content.cells} />;
    case 'pyramid':
      return <PyramidLayout rows={content.rows} ask={content.ask} />;
    case 'wheel':
      return <WheelLayout segments={content.segments} />;
    case 'cross':
      return (
        <ol aria-label="Number crosses" className="flex flex-wrap justify-center gap-3">
          {content.crosses.map((cross, i) => (
            <CrossFigure key={i} cross={cross} index={i} />
          ))}
        </ol>
      );
  }
}
