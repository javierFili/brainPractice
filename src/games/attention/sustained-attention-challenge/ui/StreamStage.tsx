import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Answer } from '@/domain/challenge';
import { Button } from '@/components/ui/Button';
import { useStepper } from '@/games/kit/ui';

interface Props {
  /** Stable id of the stream (the challenge id); a new id restarts it. */
  readonly id: string;
  readonly stream: readonly string[];
  readonly itemMs: number;
  readonly respond: ((answer: Answer) => void) | null;
  /** Rule reminder shown above the box. */
  readonly rule: string;
}

/**
 * Plays a letter stream during the response window: a "get ready" step, then one letter per step.
 * "Now!", Space or Enter records the position of the letter on screen (once per letter); when the
 * stream ends the recorded positions are submitted as a multi-select answer. Letters simply replace
 * each other at ≥ 0.7 s intervals: no flashing.
 */
export function StreamStage({ id, stream, itemMs, respond, rule }: Props) {
  const { t } = useTranslation('attention');
  const active = respond !== null;
  const step = useStepper(stream.length + 1, itemMs, active, id);
  const [pressed, setPressed] = useState<readonly number[]>([]);
  const submitted = useRef(false);
  const position = step - 1;
  const showing = step >= 1 && step <= stream.length;
  const over = step > stream.length;

  const press = () => {
    if (!active || !showing) return;
    // Functional update: a key press and a button click in the same tick must not record twice.
    setPressed((current) => (current.includes(position) ? current : [...current, position]));
  };

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (!event.repeat) press();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  });

  useEffect(() => {
    if (!over || respond === null || submitted.current) return;
    submitted.current = true;
    respond({ format: 'multi-select', indices: [...pressed].sort((a, b) => a - b) });
  }, [over, respond, pressed]);

  const letter = showing ? stream[position] : undefined;
  const recorded = showing && pressed.includes(position);
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-ink-soft">{rule}</p>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="flex h-36 w-36 items-center justify-center rounded-2xl border border-line bg-raised"
      >
        {letter === undefined ? (
          <span className="text-sm text-ink-muted">
            {over ? t('sustainedAttention.view.done') : t('sustainedAttention.view.getReady')}
          </span>
        ) : (
          <span key={step} className="animate-fade-in font-mono text-7xl font-bold text-ink">
            {letter}
          </span>
        )}
      </div>
      <p aria-hidden="true" className="text-xs text-ink-muted">
        {showing
          ? `${position + 1} / ${stream.length}`
          : t('sustainedAttention.view.letters', { count: stream.length })}
        {recorded ? ` · ${t('sustainedAttention.view.recorded')}` : ''}
      </p>
      <Button onClick={press} disabled={!active || !showing}>
        {t('sustainedAttention.view.now')}
      </Button>
    </div>
  );
}
