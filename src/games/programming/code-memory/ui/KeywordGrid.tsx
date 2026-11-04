import { useTranslation } from 'react-i18next';
import type { ChallengePhase, LocateBinding } from '@/games/types';
import { cellPosition } from '../content/format';

interface Props {
  readonly rows: number;
  readonly cols: number;
  readonly cells: readonly (string | null)[];
  readonly phase: ChallengePhase;
  readonly locate: LocateBinding | null;
  /** Cell revealed as the answer in review. */
  readonly answerIndex: number | null;
}

function ReviewCell({
  word,
  isSolution,
  isWrongPick,
}: {
  word: string | null;
  isSolution: boolean;
  isWrongPick: boolean;
}) {
  const { t } = useTranslation('programming');
  const tone = isSolution
    ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-200'
    : isWrongPick
      ? 'border-rose-400/60 bg-rose-400/10 text-rose-200'
      : 'border-slate-700 text-slate-100';
  return (
    <div
      className={`flex h-full min-h-12 flex-col items-center justify-center rounded-md border px-1 py-2 text-sm ${tone}`}
    >
      <span className="font-mono">{word ?? <span className="text-slate-600">·</span>}</span>
      {isSolution && <span className="text-xs">{t('codeMemory.view.answerMark')}</span>}
      {isWrongPick && <span className="text-xs">{t('codeMemory.view.wrongPick')}</span>}
    </div>
  );
}

/**
 * The keyword grid. Study and review show the words; while responding the grid is empty and every
 * cell is a button named by its position, so it works with keyboard and screen readers.
 */
export function KeywordGrid({ rows, cols, cells, phase, locate, answerIndex }: Props) {
  const rowIndexes = Array.from({ length: rows }, (_, r) => r);
  const colIndexes = Array.from({ length: cols }, (_, c) => c);
  const responding = phase === 'respond';
  const { t } = useTranslation('programming');
  const cellName = (index: number) => {
    const { row, col } = cellPosition(index, cols);
    return t('codeMemory.view.cell', { row, column: col });
  };

  return (
    <table
      className="w-full max-w-xl table-fixed border-separate border-spacing-1.5"
      aria-label={t('codeMemory.view.grid', { rows, columns: cols })}
    >
      <tbody>
        {rowIndexes.map((r) => (
          <tr key={r}>
            {colIndexes.map((c) => {
              const index = r * cols + c;
              const word = cells[index] ?? null;
              if (responding) {
                return (
                  <td key={c} className="p-0">
                    <button
                      type="button"
                      aria-label={cellName(index)}
                      disabled={locate?.disabled ?? true}
                      onClick={() => {
                        locate?.onLocate(index);
                      }}
                      className="h-12 w-full rounded-md border border-slate-700 bg-slate-900 transition hover:border-cyan-400/60 hover:bg-cyan-400/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span aria-hidden="true" className="text-slate-600">
                        ?
                      </span>
                    </button>
                  </td>
                );
              }
              return (
                <td
                  key={c}
                  className="p-0"
                  aria-label={word === null ? t('codeMemory.view.empty') : undefined}
                >
                  <ReviewCell
                    word={word}
                    isSolution={phase === 'review' && answerIndex === index}
                    isWrongPick={
                      phase === 'review' && locate?.selectedIndex === index && answerIndex !== index
                    }
                  />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
