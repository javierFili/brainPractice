import type { ContentViewProps } from '@/games/types';
import type { CodeScanSprintChallenge } from '../content/types';

type Marker = 'answer' | 'your pick';

const MARKER_TONE: Record<Marker, string> = {
  answer: 'border-success/60 bg-success/10 text-success',
  'your pick': 'border-danger/60 bg-danger/10 text-danger',
};

/**
 * The listing with line numbers; while answering every line is a button. In review the answer
 * line and a wrong pick carry text markers, not only colour.
 */
export function CodeScanSprintView({
  challenge,
  phase,
  locate,
  answer,
}: ContentViewProps<CodeScanSprintChallenge>) {
  const { lines } = challenge.content;
  const review = phase === 'review';
  const solution =
    challenge.response.format === 'locate' ? challenge.response.solution.index : null;
  const pick = answer?.format === 'locate' ? answer.index : (locate?.selectedIndex ?? null);

  const markersOf = (i: number): Marker[] => {
    if (!review) return [];
    if (i === solution) return ['answer'];
    return i === pick ? ['your pick'] : [];
  };

  return (
    <section aria-label="Code listing" className="min-w-0">
      <ol className="overflow-x-auto rounded-lg border border-amber-400/40 bg-canvas/60 py-2 font-mono text-sm leading-8">
        {lines.map((line, i) => {
          const markers = markersOf(i);
          const body = (
            <>
              <span
                style={{ paddingLeft: `${line.indent * 1.5}rem` }}
                className="flex-1 whitespace-pre"
              >
                {line.text}
              </span>
              {markers.map((marker) => (
                <span
                  key={marker}
                  className={`ml-2 shrink-0 rounded border px-1.5 font-sans text-xs font-semibold ${MARKER_TONE[marker]}`}
                >
                  {marker === 'answer' ? '✓ answer' : '✗ your pick'}
                </span>
              ))}
            </>
          );
          return (
            <li key={i} className="flex items-stretch">
              <span
                aria-hidden="true"
                className="w-8 shrink-0 pr-3 text-right text-ink-muted select-none"
              >
                {i + 1}
              </span>
              {locate === null ? (
                <span className="flex flex-1 items-center pr-2 text-ink">{body}</span>
              ) : (
                <button
                  type="button"
                  disabled={locate.disabled}
                  aria-label={`Line ${i + 1}: ${line.text}${markers.length > 0 ? ` (${markers.join(', ')})` : ''}`}
                  onClick={() => {
                    locate.onLocate(i);
                  }}
                  className="flex min-h-10 flex-1 items-center pr-2 text-left text-ink transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 enabled:hover:bg-amber-400/10 disabled:cursor-default"
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
