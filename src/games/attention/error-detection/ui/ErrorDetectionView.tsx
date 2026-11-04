import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useText } from '@/i18n';
import type { ContentViewProps } from '@/games/types';
import { rowTexts, ruleText } from '../content/format';
import type { ErrorDetectionChallenge } from '../content/types';

/** Rule, then the numbered rows as buttons (the `locate` answer). Review marks are spelled out. */
export function ErrorDetectionView({
  challenge,
  locate,
}: ContentViewProps<ErrorDetectionChallenge>) {
  const { t } = useTranslation('attention');
  const tx = useText();
  const { content } = challenge;
  const ruleId = useId();
  const rows = rowTexts(content).map(tx);
  const solution = locate?.solutionIndex ?? null;
  const picked = solution === null ? null : (locate?.selectedIndex ?? null);
  const interactive = locate !== null && !locate.disabled;
  return (
    <div className="flex flex-col gap-4">
      <p id={ruleId} className="rounded-lg border border-line bg-raised p-3 text-sm text-ink-soft">
        {tx(ruleText(content))}
      </p>
      <ol aria-describedby={ruleId} className="flex flex-col gap-1.5">
        {rows.map((text, i) => {
          const isError = i === solution;
          const isPick = i === picked;
          const marks = [
            isError ? `✗ ${t('errorDetection.view.wrongRow')}` : null,
            isPick
              ? isError
                ? `✓ ${t('errorDetection.view.yourPick')}`
                : t('errorDetection.view.yourPick')
              : null,
          ].filter((m): m is string => m !== null);
          const tone = isError
            ? 'border-success bg-success/10'
            : isPick
              ? 'border-danger bg-danger/10'
              : 'border-line bg-surface enabled:hover:border-line-strong';
          return (
            // Rows are fixed for the challenge's lifetime: the index is their identity.
            <li key={i}>
              <button
                type="button"
                disabled={!interactive}
                aria-label={[t('errorDetection.view.row', { row: i + 1, text }), ...marks].join(
                  ' — ',
                )}
                onClick={() => {
                  locate?.onLocate(i);
                }}
                className={`flex min-h-10 w-full flex-wrap items-baseline gap-x-3 rounded-md border px-3 py-2 text-left font-mono text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-default ${tone}`}
              >
                <span aria-hidden="true" className="w-5 shrink-0 text-right text-ink-muted">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 break-words whitespace-pre-wrap text-ink">
                  {text}
                </span>
                {marks.map((m, k) => (
                  <span
                    key={k}
                    aria-hidden="true"
                    className={`font-sans text-xs font-semibold ${isError ? 'text-success' : 'text-danger'}`}
                  >
                    {m}
                  </span>
                ))}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
