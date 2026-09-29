import type { DataRecord } from '../content/types';

const ASKED = 'rounded bg-cyan-400/15 px-1 text-cyan-200 ring-1 ring-cyan-400/40';

/** Heterogeneous records as code lines: `Order { id: 482, status: PAID }`. */
export function RecordList({
  records,
  asked,
}: {
  records: readonly DataRecord[];
  /** Highlighted in review: the record and field that were asked. */
  asked?: { readonly recordIndex: number; readonly field: string };
}) {
  return (
    <ul className="flex flex-col gap-2" aria-label="Records">
      {records.map((record, i) => {
        const isAsked = asked?.recordIndex === i;
        return (
          <li
            key={record.type}
            className={`rounded-lg border px-3 py-2 font-mono text-sm break-words ${isAsked ? 'border-cyan-400/40 bg-cyan-400/5' : 'border-slate-700'}`}
          >
            <span className="text-cyan-300">{record.type}</span>
            <span className="text-slate-500">{' { '}</span>
            {record.fields.map((field, j) => (
              <span key={field.name}>
                <span className={isAsked && field.name === asked.field ? ASKED : ''}>
                  <span className="text-slate-400">{field.name}:</span>{' '}
                  <span className="text-slate-100">{field.value}</span>
                </span>
                {j < record.fields.length - 1 && <span className="text-slate-500">, </span>}
              </span>
            ))}
            <span className="text-slate-500">{' }'}</span>
            {isAsked && <span className="ml-2 text-xs text-cyan-300">← asked</span>}
          </li>
        );
      })}
    </ul>
  );
}

export interface TableMark {
  readonly row: number;
  readonly field: string;
  readonly label: string;
}

/** Records of one type as a table; `marks` point at cells in review (key, link, answer). */
export function RecordTable({
  records,
  caption,
  marks = [],
}: {
  records: readonly DataRecord[];
  caption: string;
  marks?: readonly TableMark[];
}) {
  const columns = records[0]?.fields.map((field) => field.name) ?? [];
  const markAt = (row: number, field: string) =>
    marks.find((mark) => mark.row === row && mark.field === field);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-sm">
        <caption className="mb-2 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase">
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="border-b border-slate-700 px-2 py-1 text-left font-medium text-slate-400"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record, row) => (
            <tr
              key={record.fields[0]?.value ?? row}
              className={
                marks.some((mark) => mark.row === row) ? 'bg-cyan-400/5' : 'odd:bg-slate-800/30'
              }
            >
              {record.fields.map((field) => {
                const mark = markAt(row, field.name);
                return (
                  <td key={field.name} className="px-2 py-1 text-slate-100">
                    <span className={mark ? ASKED : ''}>{field.value}</span>
                    {mark && <span className="ml-1 text-xs text-cyan-300">({mark.label})</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
