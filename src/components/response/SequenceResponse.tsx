import { useEffect, useState, type ReactNode } from 'react';
import type { ChoiceOption, ResponseOf } from '@/domain/challenge';
import { Button } from '@/components/ui/Button';

interface Props {
  readonly response: ResponseOf<'sequence'>;
  readonly disabled: boolean;
  readonly onSubmit: (sequence: readonly string[]) => void;
  /** Visual face of a symbol; its label stays the accessible name. */
  readonly renderOption?: ((option: ChoiceOption) => ReactNode) | undefined;
}

/**
 * Rebuild a sequence from a palette: press symbols in order (or their number keys), Backspace
 * undoes the last one, Enter submits when every slot is filled. Slots show what was entered so
 * the player can check before submitting.
 */
export function SequenceResponse({ response, disabled, onSubmit, renderOption }: Props) {
  const { symbols, length } = response.question;
  const [entered, setEntered] = useState<readonly string[]>([]);
  const full = entered.length === length;
  const byId = new Map(symbols.map((s) => [s.id, s]));

  const add = (id: string) => {
    setEntered((current) => (current.length < length ? [...current, id] : current));
  };
  const undo = () => {
    setEntered((current) => current.slice(0, -1));
  };

  useEffect(() => {
    if (disabled) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLButtonElement && event.key === 'Enter') return;
      if (event.key === 'Backspace') {
        event.preventDefault();
        undo();
        return;
      }
      if (event.key === 'Enter' && full) {
        event.preventDefault();
        onSubmit(entered);
        return;
      }
      const symbol = symbols[Number(event.key) - 1];
      if (symbol && /^[1-9]$/.test(event.key)) add(symbol.id);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  });

  const face = (option: ChoiceOption) => renderOption?.(option) ?? option.label;
  return (
    <div className="flex flex-col gap-4">
      <ol
        aria-label={`Your sequence, ${entered.length} of ${length}`}
        className="flex flex-wrap justify-center gap-2"
      >
        {Array.from({ length }, (_, i) => {
          const symbol = entered[i] === undefined ? undefined : byId.get(entered[i]);
          return (
            <li
              key={i}
              aria-label={symbol ? `${i + 1}: ${symbol.label}` : `${i + 1}: empty`}
              className={`flex h-14 min-w-14 items-center justify-center rounded-lg border px-2 text-lg font-semibold ${
                symbol
                  ? 'animate-pop border-brand bg-brand/15 text-ink'
                  : 'border-dashed border-line text-ink-muted'
              }`}
            >
              {symbol ? face(symbol) : i + 1}
            </li>
          );
        })}
      </ol>
      <fieldset disabled={disabled}>
        <legend className="sr-only">Symbols</legend>
        <ul className="flex flex-wrap justify-center gap-2">
          {symbols.map((symbol, i) => (
            <li key={symbol.id}>
              <button
                type="button"
                aria-label={symbol.label}
                disabled={full}
                onClick={() => {
                  add(symbol.id);
                }}
                className="relative flex h-16 min-w-16 items-center justify-center rounded-xl border border-line bg-raised px-3 text-xl font-semibold text-ink transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
              >
                {face(symbol)}
                {i < 9 && (
                  <kbd
                    aria-hidden="true"
                    className="absolute top-0.5 left-1 text-[10px] text-ink-muted"
                  >
                    {i + 1}
                  </kbd>
                )}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={undo} disabled={disabled || entered.length === 0}>
          Undo
        </Button>
        <Button
          disabled={disabled || !full}
          onClick={() => {
            onSubmit(entered);
          }}
        >
          Submit sequence
        </Button>
      </div>
    </div>
  );
}
