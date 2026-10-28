import { ClueList, Panel } from '@/games/logic/shared/ui';
import type { ContentViewProps } from '@/games/types';
import { cellName } from '../content/solver';
import type { ConstraintChallenge } from '../content/types';

export function ConstraintView({ challenge, phase }: ContentViewProps<ConstraintChallenge>) {
  const { size, box, givens, inequalities, asked, solution } = challenge.content;
  const cols = Array.from({ length: size }, (_, c) => String.fromCharCode(65 + c));
  const reveal = phase === 'review';
  const rules = [
    `Each row and each column holds 1 to ${size} once.`,
    ...(box ? [`Each ${box[0]}×${box[1]} box (thick borders) also holds 1 to ${size} once.`] : []),
  ];
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Rules">
        <ClueList clues={rules} label="Rules" />
      </Panel>
      <table
        aria-label={`${size} by ${size} grid`}
        className="mx-auto table-fixed border-collapse text-center"
      >
        <thead>
          <tr>
            <td className="w-6" />
            {cols.map((c) => (
              <th key={c} scope="col" className="pb-1 text-xs font-semibold text-ink-muted">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: size }, (_, r) => (
            <tr key={r}>
              <th scope="row" className="pr-1 text-xs font-semibold text-ink-muted">
                {r + 1}
              </th>
              {cols.map((_, c) => {
                const i = r * size + c;
                const given = givens[i];
                const isAsked = i === asked;
                const thickRight = box !== null && c < size - 1 && (c + 1) % box[1] === 0;
                const thickBottom = box !== null && r < size - 1 && (r + 1) % box[0] === 0;
                const text =
                  given !== null && given !== undefined
                    ? String(given)
                    : isAsked
                      ? reveal
                        ? String(solution[i])
                        : '?'
                      : '';
                const name = `${cellName(i, size)}: ${
                  given !== null && given !== undefined
                    ? given
                    : isAsked
                      ? reveal
                        ? `${solution[i]}, the asked cell`
                        : 'the asked cell'
                      : 'empty'
                }`;
                return (
                  <td
                    key={c}
                    aria-label={name}
                    className={`h-11 w-11 border border-line font-mono text-lg sm:h-12 sm:w-12 ${
                      thickRight ? 'border-r-4 border-r-line-strong' : ''
                    } ${thickBottom ? 'border-b-4 border-b-line-strong' : ''} ${
                      isAsked
                        ? 'bg-glow/20 font-bold text-glow outline-2 -outline-offset-2 outline-glow'
                        : given !== null
                          ? 'bg-raised text-ink'
                          : 'bg-surface text-ink-muted'
                    }`}
                  >
                    {text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {inequalities.length > 0 && (
        <Panel title="“Smaller than” clues">
          <ClueList
            label="Smaller than clues"
            clues={inequalities.map(
              ({ smaller, larger }) => `${cellName(smaller, size)} < ${cellName(larger, size)}`,
            )}
          />
        </Panel>
      )}
    </div>
  );
}
