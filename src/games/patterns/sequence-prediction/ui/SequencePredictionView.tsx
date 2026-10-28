import type { ContentViewProps } from '@/games/types';
import { Missing } from '../../shared/ui';
import { frameWords } from '../content/frames';
import type { SequencePredictionChallenge } from '../content/types';
import { FrameGrid } from './FrameGrid';

export function SequencePredictionView({
  challenge,
}: ContentViewProps<SequencePredictionChallenge>) {
  const { frames, size, wrap } = challenge.content;
  return (
    <div className="flex flex-col items-center gap-3">
      <ol aria-label="Frames, in order" className="flex flex-wrap items-end justify-center gap-3">
        {frames.map((frame, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span className="text-xs text-ink-muted">Frame {i + 1}</span>
            <FrameGrid frame={frame} size={size} label={`Frame ${i + 1}: ${frameWords(frame)}`} />
          </li>
        ))}
        <li className="flex flex-col items-center gap-1">
          <span className="text-xs text-ink-muted">Next</span>
          <Missing label="Next frame (unknown)" className="h-20 w-20 sm:h-24 sm:w-24" />
        </li>
      </ol>
      {wrap && (
        <p className="text-sm text-ink-muted">
          <span aria-hidden="true">↺ </span>Marks leaving one edge come back on the opposite edge.
        </p>
      )}
    </div>
  );
}
