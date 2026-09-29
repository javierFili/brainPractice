import { useEffect } from 'react';
import type { ResponseOf } from '@/domain/challenge';

interface Props {
  readonly response: ResponseOf<'single-choice'>;
  readonly disabled: boolean;
  /** After answering: what was picked and what was right. */
  readonly review: { readonly selectedId: string | null } | null;
  readonly onSelect: (optionId: string) => void;
  readonly monospace?: boolean;
}

/** Options answer on click or with number keys 1–n. State is shown with text + icon, not only colour. */
export function ChoiceResponse({ response, disabled, review, onSelect, monospace = false }: Props) {
  const { options } = response.question;

  useEffect(() => {
    if (disabled) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      const option = options[Number(event.key) - 1];
      if (option) onSelect(option.id);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [disabled, options, onSelect]);

  return (
    <fieldset>
      <legend className="sr-only">Answer options</legend>
      <ul className="grid gap-2 sm:grid-cols-2">
        {options.map((option, i) => {
          const isSolution = review !== null && option.id === response.solution.optionId;
          const isWrongPick = review !== null && option.id === review.selectedId && !isSolution;
          const tone = isSolution
            ? 'border-emerald-400/70 bg-emerald-400/10'
            : isWrongPick
              ? 'border-rose-400/70 bg-rose-400/10'
              : 'border-slate-700 bg-slate-900 hover:border-slate-500 hover:bg-slate-800';
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onSelect(option.id);
                }}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 disabled:cursor-default ${tone}`}
              >
                <kbd
                  aria-hidden="true"
                  className="mt-0.5 rounded border border-slate-600 px-1.5 font-mono text-xs text-slate-400"
                >
                  {i + 1}
                </kbd>
                <span className={`flex-1 break-words ${monospace ? 'font-mono' : ''}`}>
                  {option.label}
                </span>
                {isSolution && (
                  <span className="text-xs font-semibold text-emerald-300">✓ Correct answer</span>
                )}
                {isWrongPick && (
                  <span className="text-xs font-semibold text-rose-300">✗ Your answer</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
