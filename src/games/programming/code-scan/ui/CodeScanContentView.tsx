import { useTranslation } from 'react-i18next';
import type { ContentViewProps, LocateBinding } from '@/games/types';
import { changedLines, lineText } from '../content/format';
import type { Snippet, SpeedChallenge } from '../content/types';

type Marker = 'check' | 'changed' | 'pick';

const MARKER_TONE: Record<Marker, string> = {
  check: 'border-amber-400/60 bg-amber-400/10 text-amber-200',
  changed: 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200',
  pick: 'border-sky-400/60 bg-sky-400/10 text-sky-200',
};

type Column = 'original' | 'copy';

interface ColumnProps {
  readonly column: Column;
  readonly lines: Snippet;
  readonly markersOf: (index: number) => readonly Marker[];
  /** Present only on the copy column of a find-the-change challenge. */
  readonly locate: LocateBinding | null;
}

function LineBody({
  text,
  indent,
  markers,
}: {
  text: string;
  indent: number;
  markers: readonly Marker[];
}) {
  const { t } = useTranslation('programming');
  return (
    <>
      <span
        style={{ paddingLeft: `${indent * 1.5}rem` }}
        className="flex-1 font-mono whitespace-pre"
      >
        {text}
      </span>
      {markers.map((marker) => (
        <span
          key={marker}
          className={`ml-2 shrink-0 rounded border px-1.5 font-sans text-xs font-semibold ${MARKER_TONE[marker]}`}
        >
          {t(`codeScan.view.marker.${marker}`)}
        </span>
      ))}
    </>
  );
}

/** One listing with line numbers; in the copy of find-the-change every line is a button. */
function SnippetColumn({ column, lines, markersOf, locate }: ColumnProps) {
  const { t } = useTranslation('programming');
  return (
    <section aria-label={t(`codeScan.view.snippet.${column}`)} className="min-w-0">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-amber-300 uppercase">
        {t(`codeScan.view.title.${column}`)}
      </h3>
      <ol className="overflow-x-auto rounded-lg border border-amber-400/40 bg-slate-950/60 py-2 text-sm leading-7">
        {lines.map((line, i) => {
          const text = lineText(line);
          const markers = markersOf(i);
          const flagged = markers.length > 0;
          return (
            <li key={i} className="flex items-stretch">
              <span
                aria-hidden="true"
                className="w-8 shrink-0 pr-3 text-right font-mono text-slate-600 select-none"
              >
                {i + 1}
              </span>
              {locate === null ? (
                <span
                  className={`flex flex-1 items-center pr-2 ${flagged ? 'bg-slate-800/60' : ''}`}
                >
                  <LineBody text={text} indent={line.indent} markers={markers} />
                </span>
              ) : (
                <button
                  type="button"
                  disabled={locate.disabled}
                  aria-label={
                    flagged
                      ? t('codeScan.view.lineMarked', {
                          line: i + 1,
                          code: text,
                          markers: markers
                            .map((marker) => t(`codeScan.view.marker.${marker}`))
                            .join(', '),
                        })
                      : t('codeScan.view.line', { line: i + 1, code: text })
                  }
                  onClick={() => {
                    locate.onLocate(i);
                  }}
                  className={`flex flex-1 items-center pr-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 enabled:hover:bg-amber-400/10 disabled:cursor-default ${flagged ? 'bg-slate-800/60' : ''}`}
                >
                  <LineBody text={text} indent={line.indent} markers={markers} />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Original and copy side by side (stacked on small screens). Content stays visible in every
 * phase; in review the changed line and the player's pick are marked with text, not only colour.
 */
export function CodeScanContentView({
  challenge,
  phase,
  locate,
}: ContentViewProps<SpeedChallenge>) {
  const { t } = useTranslation('programming');
  const { content } = challenge;
  const review = phase === 'review';
  const solution = review ? (locate?.solutionIndex ?? null) : null;
  const changed = new Set(review ? changedLines(content.original, content.copy) : []);
  if (solution !== null) changed.add(solution);
  const highlight = content.kind === 'classify-the-change' ? content.highlightLine : null;
  const pick = review ? (locate?.selectedIndex ?? null) : null;

  const markersOf =
    (column: Column) =>
    (index: number): Marker[] => {
      const markers: Marker[] = [];
      if (index === highlight && !review) markers.push('check');
      if (changed.has(index)) markers.push('changed');
      if (column === 'copy' && index === pick) markers.push('pick');
      return markers;
    };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 md:grid-cols-2">
        <SnippetColumn
          column="original"
          lines={content.original}
          markersOf={markersOf('original')}
          locate={null}
        />
        <SnippetColumn
          column="copy"
          lines={content.copy}
          markersOf={markersOf('copy')}
          locate={content.kind === 'find-the-change' ? locate : null}
        />
      </div>
      {review && changed.size === 0 && (
        <p className="text-sm text-slate-300">{t('codeScan.view.identical')}</p>
      )}
    </div>
  );
}
