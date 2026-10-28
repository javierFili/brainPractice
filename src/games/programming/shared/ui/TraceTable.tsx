import { useMemo } from 'react';
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
        Step-by-step trace
      </summary>
      <div className="max-w-full overflow-x-auto px-3 pb-3">
        <table className="w-full min-w-max border-collapse font-mono text-xs">
          <caption className="sr-only">Each step that changed a variable</caption>
          <thead>
            <tr className="text-left text-ink-muted">
              <th scope="col" className="py-1 pr-3 font-normal">
                Line
              </th>
              <th scope="col" className="py-1 pr-3 font-normal">
                Code
              </th>
              <th scope="col" className="py-1 font-normal">
                After it runs
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-1 pr-3 text-ink-muted">{row.line}</td>
                <td className="py-1 pr-3 whitespace-pre text-ink-soft">{row.code}</td>
                <td className="py-1 text-ink">{row.changes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > shown.length && (
          <p className="mt-2 text-xs text-ink-muted">
            … {rows.length - shown.length} more steps follow the same pattern.
          </p>
        )}
        <p className="mt-2 text-xs text-ink-muted">
          Output:{' '}
          <span className="font-mono text-ink">
            {output.length === 0 ? '(nothing printed)' : output.join(' · ')}
          </span>
          {error !== null && (
            <span className="text-danger">
              {' '}
              · stopped on line {error.line}: {error.message}
            </span>
          )}
        </p>
      </div>
    </details>
  );
}
