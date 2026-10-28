import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Answer, ResponseOf } from '@/domain/challenge';

type Stage = 'waiting' | 'signal' | 'done';

interface Props {
  readonly response: ResponseOf<'tap'>;
  readonly respond: ((answer: Answer) => void) | null;
  readonly answer: Answer | null;
  /** What is shown before the signal (a fixation point, a neutral stimulus). */
  readonly waiting: ReactNode;
  /** The stimulus shown during the window; for no-go trials it is the "do not tap" stimulus. */
  readonly signal: ReactNode;
  /** Accessible description of the stimulus, announced when it appears. */
  readonly signalLabel: string;
  /** Monotonic time source; injectable for tests. */
  readonly now?: () => number;
}

const defaultNow = () => performance.now();

/**
 * Reaction stage for the `tap` format: waits `signalDelayMs`, shows the signal for `windowMs`,
 * and reports whether and when the player tapped, measured from signal onset. A tap before the
 * signal is reported as a false start (negative reaction time). Space, Enter or a tap/click on the
 * stage all count, so the task works with a keyboard, a mouse, a touch screen or a switch.
 */
export function TapStage({
  response,
  respond,
  answer,
  waiting,
  signal,
  signalLabel,
  now = defaultNow,
}: Props) {
  const { signalDelayMs, windowMs } = response.question;
  const [stage, setStage] = useState<Stage>('waiting');
  const onset = useRef<number | null>(null);
  const opened = useRef<number | null>(null);
  const done = useRef(false);
  const active = respond !== null;

  useEffect(() => {
    if (!active) return undefined;
    done.current = false;
    opened.current = now();
    const show = setTimeout(() => {
      onset.current = now();
      setStage('signal');
    }, signalDelayMs);
    const close = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      setStage('done');
      respond({ format: 'tap', tapped: false, reactionMs: null });
    }, signalDelayMs + windowMs);
    return () => {
      clearTimeout(show);
      clearTimeout(close);
    };
    // `respond` identity changes per render; the trial is keyed by its response.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, response]);

  const tap = () => {
    if (!active || done.current) return;
    done.current = true;
    const reactionMs =
      onset.current === null
        ? -Math.max(1, Math.round(signalDelayMs - (now() - (opened.current ?? now()))))
        : Math.round(now() - onset.current);
    setStage('done');
    respond({ format: 'tap', tapped: true, reactionMs });
  };

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      if (event.repeat) return;
      event.preventDefault();
      tap();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  });

  const reviewed = answer?.format === 'tap' ? answer : null;
  const showSignal =
    stage === 'signal' ||
    (reviewed !== null && reviewed.reactionMs !== null && reviewed.reactionMs >= 0);
  return (
    <button
      type="button"
      onClick={tap}
      disabled={!active}
      aria-label={
        active
          ? stage === 'signal'
            ? `${signalLabel}. Tap now if it is a go signal.`
            : 'Wait for the signal. Press Space or tap when it appears.'
          : signalLabel
      }
      className="flex min-h-56 w-full touch-manipulation items-center justify-center rounded-2xl border border-line bg-surface select-none focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-default sm:min-h-72"
    >
      <span aria-live="assertive" className="sr-only">
        {stage === 'signal' ? signalLabel : ''}
      </span>
      {showSignal ? signal : waiting}
    </button>
  );
}
