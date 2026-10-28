import { Shape } from '../../shared/ui';
import { frameWords } from '../content/frames';
import type { Frame } from '../content/types';

/** One frame: a size × size grid with its marks. The label names every mark and its cell. */
export function FrameGrid({
  frame,
  size,
  label,
  decorative = false,
}: {
  readonly frame: Frame;
  readonly size: number;
  readonly label?: string;
  readonly decorative?: boolean;
}) {
  return (
    <div
      className="grid w-20 gap-0.5 sm:w-24"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': label ?? frameWords(frame) })}
    >
      {Array.from({ length: size * size }, (_, i) => {
        const mark = frame.marks.find((m) => m.row * size + m.col === i);
        return (
          <span
            key={i}
            className="flex aspect-square items-center justify-center rounded-sm border border-line bg-raised"
          >
            {mark && <Shape figure={mark.figure} className="h-4/5 w-4/5" />}
          </span>
        );
      })}
    </div>
  );
}
