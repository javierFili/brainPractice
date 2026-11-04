import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useText } from '@/i18n';
import { executeOrThrow, type Variables } from '@/domain/pseudocode';
import { traceChanges } from '../content/explain';

interface Props {
  readonly source: string;
  readonly inputs?: Variables;
  /** Rows shown before the table is cut (long loops). */
  readonly limit?: number;
}

/**
 * Step-by-step replay of a program, produced by the same interpreter that computed the answer.
 * Shown after answering so the player can see where their trace diverged.
 */
export function TraceTable({ source, inputs = {}, limit = 40 }: Props) {
  const { t } = useTranslation('programming');
  const tx = useText();
  const { rows, output, error } = useMemo(() => {
    const result = executeOrThrow(source, inputs);
    return {
      rows: traceChanges(source, result).filter((step) => step.changes.length > 0),
      output: result.output,
      error: result.error,
    };
  }, [source, inputs]);
  const shown = rows.slice(0, limit);
  return (
    <details className="rounded-lg border border-line bg-surface text-sm" open>
      <summary className="cursor-pointer px-3 py-2 font-medium text-ink-soft hover:text-ink">
        {t('shared.trace.title')}
      </summary>
      <div className="max-w-full overflow-x-auto px-3 pb-3">
        <table className="w-full min-w-max border-collapse text-xs">
          <caption className="sr-only">{t('shared.trace.caption')}</caption>
          <thead>
            <tr className="text-left text-ink-muted">
              <th scope="col" className="py-1 pr-3 font-normal">
                {t('shared.trace.line')}
              </th>
              <th scope="col" className="py-1 pr-3 font-normal">
                {t('shared.trace.code')}
              </th>
              <th scope="col" className="py-1 font-normal">
                {t('shared.trace.after')}
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-1 pr-3 font-mono text-ink-muted">{row.line}</td>
                <td className="py-1 pr-3 font-mono whitespace-pre text-ink-soft">{row.code}</td>
                <td className="py-1 font-mono text-ink">{row.changes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > shown.length && (
          <p className="mt-2 text-xs text-ink-muted">
            {t('shared.trace.more', { count: rows.length - shown.length })}
          </p>
        )}
        <p className="mt-2 text-xs text-ink-muted">
          {t('shared.trace.output')}{' '}
          {output.length === 0 ? (
            <span className="text-ink">{t('shared.trace.nothingPrinted')}</span>
          ) : (
            <span className="font-mono text-ink">{output.join(' · ')}</span>
          )}
          {error !== null && (
            <span className="text-danger">
              {' '}
              · {t('shared.trace.stopped', { line: error.line, message: tx(error.message) })}
            </span>
          )}
        </p>
      </div>
    </details>
  );
}
