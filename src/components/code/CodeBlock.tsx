import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { highlightLine, type TokenKind } from './highlight';

const TONE: Readonly<Record<TokenKind, string>> = {
  keyword: 'text-violet-300',
  string: 'text-amber-200',
  number: 'text-sky-300',
  comment: 'text-slate-500 italic',
  builtin: 'text-emerald-300',
  plain: 'text-slate-100',
};

export interface LineSelection {
  readonly selected: number | null;
  readonly onSelect: (line: number) => void;
  readonly disabled: boolean;
  /** Marks the right line once revealed. */
  readonly solution: number | null;
}

interface Props {
  readonly source: string;
  readonly caption?: ReactNode;
  /** Lines worth looking at (1-based). */
  readonly highlight?: readonly number[];
  /** Lines the last run executed, to show the path taken. */
  readonly executed?: ReadonlySet<number>;
  /** The line a step-through is on. */
  readonly current?: number | null;
  /** Makes each line a button (debugging exercises). */
  readonly selection?: LineSelection;
  readonly label?: string;
}

/**
 * Pseudocode as an ordered list of lines (valid markup, line numbers that screen readers read),
 * with optional highlights, an executed-path marker and line selection.
 */
export function CodeBlock({
  source,
  caption,
  highlight = [],
  executed,
  current = null,
  selection,
  label,
}: Props) {
  const { t } = useTranslation('home');
  const lines = source.split('\n');
  return (
    <figure className="flex flex-col gap-2">
      <div
        className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 py-2 font-mono text-sm leading-6"
        role="group"
        aria-label={label ?? t('ui.code.label')}
      >
        <ol className="min-w-max">
          {lines.map((line, i) => {
            const number = i + 1;
            const ran = executed?.has(number) ?? false;
            const isCurrent = current === number;
            const marked = highlight.includes(number);
            const picked = selection?.selected === number;
            const isSolution = selection?.solution === number;
            const background = isCurrent
              ? 'bg-sky-400/15'
              : isSolution
                ? 'bg-emerald-400/15'
                : picked
                  ? 'bg-rose-400/15'
                  : marked
                    ? 'bg-amber-400/10'
                    : '';
            const content = (
              <>
                <span
                  aria-hidden="true"
                  className="w-8 shrink-0 pr-3 text-right text-slate-600 select-none"
                >
                  {number}
                </span>
                <span
                  aria-hidden="true"
                  className={`w-3 shrink-0 ${ran ? 'text-sky-400' : 'text-transparent'}`}
                  title={ran ? t('ui.code.ran') : undefined}
                >
                  ▸
                </span>
                <span className="whitespace-pre">
                  {line === ''
                    ? ' '
                    : highlightLine(line).map((token, j) => (
                        <span key={j} className={TONE[token.kind]}>
                          {token.text}
                        </span>
                      ))}
                </span>
                {isSolution && (
                  <span className="ml-3 text-xs font-semibold text-emerald-300">
                    {t('ui.code.bug')}
                  </span>
                )}
                {picked && !isSolution && (
                  <span className="ml-3 text-xs font-semibold text-rose-300">
                    {t('ui.code.pick')}
                  </span>
                )}
              </>
            );
            const sr = `${[
              t('ui.code.line', { number }),
              ...(ran ? [t('ui.code.lineRan')] : []),
              ...(isCurrent ? [t('ui.code.lineCurrent')] : []),
            ].join(t('ui.code.separator'))}: `;
            return (
              <li key={number} className={`flex pr-4 ${background}`}>
                {selection ? (
                  <button
                    type="button"
                    disabled={selection.disabled}
                    aria-pressed={picked}
                    onClick={() => {
                      selection.onSelect(number);
                    }}
                    className="flex w-full text-left hover:bg-slate-800/60 focus-visible:outline-2 focus-visible:outline-sky-400 disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <span className="sr-only">{sr}</span>
                    {content}
                  </button>
                ) : (
                  <>
                    <span className="sr-only">{sr}</span>
                    {content}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      {caption !== undefined && (
        <figcaption className="text-xs text-slate-400">{caption}</figcaption>
      )}
    </figure>
  );
}
