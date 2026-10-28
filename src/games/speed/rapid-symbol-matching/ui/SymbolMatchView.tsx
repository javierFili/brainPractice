import type { ContentViewProps } from '@/games/types';
import { spokenString, symbolsOf } from '../content/symbols';
import type { SymbolMatchChallenge } from '../content/types';

function SymbolString({ text, label }: { readonly text: string; readonly label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <span className="text-xs tracking-wide text-ink-muted uppercase">{label}</span>
      <span className="rounded-xl border border-line bg-raised px-3 py-2 font-mono text-3xl tracking-[0.25em] text-ink sm:text-4xl">
        <span className="sr-only">{spokenString(text)}</span>
        <span aria-hidden="true">{text}</span>
      </span>
    </div>
  );
}

/** Both strings (same-different) or the reference alone (find-match: candidates are the options). */
export function SymbolMatchView({ challenge, phase }: ContentViewProps<SymbolMatchChallenge>) {
  const { reference, other, kind } = challenge.content;
  return (
    <div className="flex flex-col items-center gap-3">
      {kind === 'same-different' && other !== null ? (
        <div className="flex flex-wrap items-end justify-center gap-4">
          <SymbolString text={reference} label="Left" />
          <SymbolString text={other} label="Right" />
        </div>
      ) : (
        <SymbolString text={reference} label="Reference" />
      )}
      {phase === 'review' && kind === 'same-different' && other !== null && other !== reference && (
        <p aria-hidden="true" className="font-mono text-2xl tracking-[0.25em] text-ink-soft">
          {symbolsOf(other).map((ch, i) => (
            <span
              key={i}
              className={ch === symbolsOf(reference)[i] ? '' : 'font-bold text-glow underline'}
            >
              {ch}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
