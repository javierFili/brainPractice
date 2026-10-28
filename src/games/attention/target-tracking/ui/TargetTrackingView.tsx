import { useMemo } from 'react';
import { CellGrid, useStepper, type CellState, type GridCell } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { listWords, markLabel, type Mark } from '../../shared/content';
import { MarkFace } from '../../shared/ui';
import { arrangementAfter } from '../content/definition';
import type { TargetTrackingChallenge } from '../content/types';

type Frame =
  | { readonly type: 'reveal' }
  | { readonly type: 'swap'; readonly step: number }
  | { readonly type: 'gap'; readonly step: number };

function Covered() {
  return (
    <span aria-hidden="true" className="text-2xl font-bold text-ink-muted">
      ?
    </span>
  );
}

/**
 * Shows the cards face up with the followed ones marked, then covers them and plays the swaps one
 * at a time: an arrow joins the two positions for half a step, then a pause. Nothing moves; each
 * swap is also announced as text. Positions become pressable only once every swap has been shown.
 */
export function TargetTrackingView({
  challenge,
  phase,
  locate,
  assisted,
}: ContentViewProps<TargetTrackingChallenge>) {
  const { items, followed, asked, swaps, stepMs, revealMs } = challenge.content;
  const slots = items.length;
  const half = (stepMs / 2) * (assisted ? 1.5 : 1);
  const frames = useMemo<Frame[]>(
    () => [
      ...Array.from(
        { length: Math.ceil(revealMs / (stepMs / 2)) },
        () => ({ type: 'reveal' }) as const,
      ),
      ...swaps.flatMap((_, step) => [
        { type: 'swap', step } as const,
        { type: 'gap', step } as const,
      ]),
    ],
    [revealMs, stepMs, swaps],
  );
  const index = useStepper(frames.length, half, phase === 'respond', challenge.id);
  const frame = phase === 'review' ? undefined : frames[index];
  const askedItem = items[asked] as Mark;

  const final = arrangementAfter(slots, swaps);
  const solution = locate?.solutionIndex ?? null;
  const picked = solution === null ? null : (locate?.selectedIndex ?? null);
  const active = frame?.type === 'swap' ? swaps[frame.step] : undefined;
  const done = frame === undefined;
  const reviewing = phase === 'review';

  const cells = Array.from({ length: slots }, (_, position): GridCell => {
    const position1 = position + 1;
    if (frame?.type === 'reveal') {
      const item = items[position] as Mark;
      const marked = followed.includes(position);
      return {
        key: String(position),
        label: `position ${position1}, ${markLabel(item)}${marked ? ', follow this card' : ''}`,
        content: (
          <span className="flex flex-col items-center">
            <MarkFace mark={item} className="h-10 w-10" />
            {marked && (
              <span aria-hidden="true" className="text-xs font-bold text-glow">
                ★ follow
              </span>
            )}
          </span>
        ),
        state: marked ? 'highlight' : 'idle',
      };
    }
    if (reviewing) {
      const item = items[final[position] as number] as Mark;
      const state: CellState =
        position === solution ? 'hit' : position === picked ? 'wrong' : 'dim';
      return {
        key: String(position),
        label: `position ${position1}, ${markLabel(item)}`,
        content: <MarkFace mark={item} className="h-10 w-10" />,
        state,
      };
    }
    const swapping = active !== undefined && active.includes(position);
    return {
      key: String(position),
      label: `position ${position1}, covered card${swapping ? ', swapping' : ''}`,
      content: <Covered />,
      state: swapping ? 'highlight' : 'idle',
    };
  });

  const status =
    frame?.type === 'reveal'
      ? `Remember the marked ${followed.length === 1 ? 'card' : 'cards'}: ${listWords(
          followed.map((p) => `${markLabel(items[p] as Mark)} in position ${p + 1}`),
        )}.`
      : frame?.type === 'swap' && active !== undefined
        ? `Swap ${frame.step + 1} of ${swaps.length}: cards ${active[0] + 1} and ${active[1] + 1} change places.`
        : frame?.type === 'gap'
          ? `Swap ${frame.step + 1} of ${swaps.length} done.`
          : reviewing
            ? 'Where the cards ended up.'
            : `Where is the ${markLabel(askedItem)} now?`;

  const interactive = done && !reviewing && locate !== null && !locate.disabled;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-xl">
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${slots * 10} 10`}
          preserveAspectRatio="none"
          className="mb-1 block h-6 w-full"
        >
          {active !== undefined && (
            <path
              d={`M${active[0] * 10 + 5} 10 Q${((active[0] + active[1]) / 2) * 10 + 5} -6 ${active[1] * 10 + 5} 10`}
              className="fill-none stroke-glow"
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        <CellGrid
          label="Cards"
          columns={slots}
          cells={cells}
          {...(interactive
            ? {
                onPress: (i: number) => {
                  locate.onLocate(i);
                },
              }
            : {})}
          disabled={!interactive}
        />
      </div>
      <p
        aria-live="polite"
        className="flex min-h-8 items-center gap-2 text-center text-sm text-ink-soft"
      >
        {done && !reviewing && <MarkFace mark={askedItem} className="h-7 w-7" />}
        <span>{active !== undefined ? `⇄ ${status}` : status}</span>
      </p>
    </div>
  );
}
