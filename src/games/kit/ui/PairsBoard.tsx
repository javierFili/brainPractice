import { useEffect, useState, type ReactNode } from 'react';
import { pairsTally, type Answer, type ResponseOf } from '@/domain/challenge';
import { CellGrid, type CellState } from './CellGrid';

interface Props {
  readonly response: ResponseOf<'pairs'>;
  /** Face of each card (shown when turned over) and its spoken name. */
  readonly faces: readonly { readonly content: ReactNode; readonly label: string }[];
  readonly columns: number;
  readonly respond: ((answer: Answer) => void) | null;
  readonly answer: Answer | null;
  /** All faces visible (study phase or review). */
  readonly revealAll: boolean;
  /** How long a mismatched pair stays visible before turning back. */
  readonly mismatchMs?: number;
}

/**
 * Concentration-style board for the `pairs` format. The board only records which cards were
 * turned over together; the session decides whether the attempts solve the challenge. It submits
 * as soon as every pair is found or the miss budget is exhausted.
 */
export function PairsBoard({
  response,
  faces,
  columns,
  respond,
  answer,
  revealAll,
  mismatchMs = 900,
}: Props) {
  const [attempts, setAttempts] = useState<readonly (readonly [number, number])[]>([]);
  const [open, setOpen] = useState<readonly number[]>([]);
  const { pairs } = response.solution;
  const { maxMisses } = response.question;
  const partner = new Map(pairs.flatMap(([a, b]) => [[a, b] as const, [b, a] as const]));
  const matched = new Set(
    attempts.filter(([a, b]) => partner.get(a) === b).flatMap(([a, b]) => [a, b]),
  );
  const { found, misses } = pairsTally(pairs, attempts);

  // A mismatched pair turns back after a short look.
  useEffect(() => {
    if (open.length !== 2) return undefined;
    const timer = setTimeout(() => {
      setOpen([]);
    }, mismatchMs);
    return () => {
      clearTimeout(timer);
    };
  }, [open, mismatchMs]);

  const press = (index: number) => {
    // A third card closes a mismatched pair that is still showing.
    const showing = open.length === 2 ? [] : open;
    if (respond === null || matched.has(index) || showing.includes(index)) return;
    const turned = [...showing, index];
    setOpen(turned);
    if (turned.length < 2) return;
    const attempt = [turned[0] as number, index] as const;
    const next = [...attempts, attempt];
    setAttempts(next);
    const tally = pairsTally(pairs, next);
    if (partner.get(attempt[0]) === index) setOpen([]);
    if (tally.found === pairs.length || tally.misses > maxMisses) {
      respond({ format: 'pairs', attempts: next });
    }
  };

  const reviewed = answer?.format === 'pairs';
  const cells = faces.map((face, index) => {
    const visible = revealAll || reviewed || matched.has(index) || open.includes(index);
    const state: CellState = matched.has(index)
      ? 'hit'
      : open.includes(index)
        ? 'highlight'
        : reviewed
          ? 'missed'
          : 'idle';
    return {
      key: String(index),
      label: visible ? `card ${index + 1}, ${face.label}` : `card ${index + 1}, face down`,
      content: visible ? (
        <span className="animate-flip">{face.content}</span>
      ) : (
        <span aria-hidden="true" className="text-2xl text-ink-muted">
          ?
        </span>
      ),
      state,
    };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <CellGrid
        cells={cells}
        columns={columns}
        label="Cards"
        {...(respond !== null && !revealAll ? { onPress: press } : {})}
        disabled={respond === null}
      />
      {!revealAll && (
        <p aria-live="polite" className="text-sm text-ink-muted">
          {found} of {pairs.length} pairs found · {misses} of {maxMisses}{' '}
          {maxMisses === 1 ? 'miss' : 'misses'} allowed
        </p>
      )}
    </div>
  );
}
