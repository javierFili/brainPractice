import type { Stmt } from '../content/types';
import { toLines } from './formatPseudocode';

/** Language-neutral pseudocode listing with line numbers and indentation guides. */
export function Pseudocode({ program }: { program: readonly Stmt[] }) {
  const lines = toLines(program);
  return (
    <pre className="overflow-x-auto font-mono text-sm leading-7" aria-label="Pseudocode program">
      <code>
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span
              aria-hidden="true"
              className="w-8 shrink-0 pr-3 text-right text-slate-600 select-none"
            >
              {i + 1}
            </span>
            <span
              style={{ paddingLeft: `${line.depth * 1.5}rem` }}
              className={line.depth > 0 ? 'border-l border-slate-800' : ''}
            >
              <span className="pl-2 font-semibold text-violet-300">{line.keyword}</span>
              {line.keyword === 'else' ? line.text : ` ${line.text}`}
            </span>
          </div>
        ))}
      </code>
    </pre>
  );
}
