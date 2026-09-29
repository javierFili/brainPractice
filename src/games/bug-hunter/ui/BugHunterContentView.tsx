import { useId, useMemo } from 'react';
import type { ContentViewProps } from '@/games/types';
import { itemTexts, ruleTexts } from '../content/format';
import { findViolations } from '../content/solvers/violations';
import type { AttentionChallenge, BugHunterKind } from '../content/types';

const ARTIFACT: Record<BugHunterKind, string> = {
  'sequence-anomaly': 'Log',
  'schema-violation': 'Records',
  'multi-rule': 'Log',
  'code-rule': 'Program',
};

const heading = 'mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase';

/**
 * Rules panel followed by the numbered artifact. Every item is a button (the `locate` answer);
 * review state is spelled out in text — "breaks rule", "your pick" — never by colour alone.
 */
export function BugHunterContentView({
  challenge,
  phase,
  locate,
}: ContentViewProps<AttentionChallenge>) {
  const { content } = challenge;
  const rulesId = useId();
  const itemsId = useId();
  const rules = ruleTexts(content);
  const items = useMemo(() => itemTexts(content), [content]);

  const solution = phase === 'review' ? (locate?.solutionIndex ?? null) : null;
  const picked = phase === 'review' ? (locate?.selectedIndex ?? null) : null;
  const broken = useMemo(
    () =>
      solution === null
        ? null
        : (findViolations(content).find((v) => v.index === solution) ?? null),
    [content, solution],
  );
  const interactive = locate !== null && !locate.disabled;
  const numbered = rules.length > 1;

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby={rulesId}>
        <h3 id={rulesId} className={heading}>
          {numbered ? 'Rules — every item must satisfy all of them' : 'Rule'}
        </h3>
        <ol className="space-y-1.5 rounded-lg border border-rose-400/40 bg-rose-400/5 p-3 text-sm text-slate-200">
          {rules.map((rule, i) => (
            <li key={rule} className="flex gap-2">
              <span className="shrink-0 font-mono text-rose-300">R{i + 1}</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby={itemsId}>
        <h3 id={itemsId} className={heading}>
          {ARTIFACT[content.kind]} · {items.length} items
        </h3>
        <ol className="flex flex-col gap-1">
          {items.map((text, i) => {
            const isBug = i === solution;
            const isPick = i === picked;
            const markers = [
              isBug && broken
                ? `✗ breaks rule${numbered ? ` R${broken.ruleIndex + 1}` : ''}: ${broken.rule}`
                : null,
              isPick ? (isBug ? '✓ your pick' : 'your pick') : null,
            ].filter((m): m is string => m !== null);
            const tone = isBug
              ? 'border-emerald-400/70 bg-emerald-400/10'
              : isPick
                ? 'border-rose-400/70 bg-rose-400/10'
                : 'border-slate-800 bg-slate-900 enabled:hover:border-slate-500 enabled:hover:bg-slate-800';
            return (
              // Items are a fixed list for the lifetime of the challenge: the index is their identity.
              <li key={i}>
                <button
                  type="button"
                  disabled={!interactive}
                  aria-label={[`Item ${i + 1}: ${text}`, ...markers].join(' — ')}
                  onClick={() => {
                    locate?.onLocate(i);
                  }}
                  className={`flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md border px-2 py-1 text-left font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 disabled:cursor-default sm:text-sm ${tone}`}
                >
                  <span aria-hidden="true" className="w-6 shrink-0 text-right text-slate-500">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-slate-100">{text}</span>
                  {markers.map((marker) => (
                    <span
                      key={marker}
                      aria-hidden="true"
                      className={`font-sans text-xs font-semibold ${isBug ? 'text-emerald-300' : 'text-rose-300'}`}
                    >
                      {marker}
                    </span>
                  ))}
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
