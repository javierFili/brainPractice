import { useId, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import type { ResponseOf } from '@/domain/challenge';
import { useText } from '@/i18n';
import { Button } from '../ui/Button';

interface Props {
  readonly response: ResponseOf<'numeric'>;
  readonly disabled: boolean;
  readonly onSubmit: (value: number) => void;
}

export function NumericResponse({ response, disabled, onSubmit }: Props) {
  const id = useId();
  const { t } = useTranslation();
  const tx = useText();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<'response.enterNumber' | null>(null);

  const submit: NonNullable<ComponentProps<'form'>['onSubmit']> = (event) => {
    event.preventDefault();
    // Accept the typographic minus some keyboards insert, and a decimal comma (3,5) as well as a
    // point: it is the usual separator in Spanish, Italian, French and German.
    const text = raw.trim().replace(/^[−–]/, '-').replace(',', '.');
    const value = text === '' ? Number.NaN : Number(text);
    if (!Number.isFinite(value)) {
      setError('response.enterNumber');
      return;
    }
    setError(null);
    onSubmit(value);
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm text-slate-300">
          {response.question.unit !== undefined
            ? t('response.yourAnswerUnit', { unit: tx(response.question.unit) })
            : t('response.yourAnswer')}
        </label>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          disabled={disabled}
          value={raw}
          onChange={(event) => {
            setRaw(event.target.value);
          }}
          aria-invalid={error !== null}
          aria-describedby={error !== null ? `${id}-error` : undefined}
          className="w-40 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-lg text-white focus-visible:border-sky-400 focus-visible:outline-none"
        />
      </div>
      {/* Mobile numeric keypads (iOS) have no minus key. */}
      <Button
        variant="secondary"
        disabled={disabled}
        aria-label={t('response.toggleSign')}
        onClick={() => {
          setRaw((current) =>
            current.trim().startsWith('-') ? current.trim().slice(1) : `-${current.trim()}`,
          );
        }}
      >
        ±
      </Button>
      <Button type="submit" disabled={disabled}>
        {t('actions.submit')}
      </Button>
      {error !== null && (
        <p id={`${id}-error`} role="alert" className="w-full text-sm text-rose-300">
          {t(error)}
        </p>
      )}
    </form>
  );
}
