import type { ContentViewProps } from '@/games/types';
import { FigureFace, Missing } from '../../shared/ui';
import type { VisualPatternChallenge } from '../content/types';

export function VisualPatternView({ challenge }: ContentViewProps<VisualPatternChallenge>) {
  const { items } = challenge.content;
  return (
    <ol
      aria-label="Pattern row, left to right"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {items.map((item, i) => (
        <li
          key={i}
          className="flex h-14 min-w-14 items-center justify-center rounded-lg border border-line bg-raised px-1 sm:h-16 sm:min-w-16"
        >
          <FigureFace figure={item} />
        </li>
      ))}
      <li>
        <Missing label="Next figure (unknown)" className="h-14 w-14 sm:h-16 sm:w-16" />
      </li>
    </ol>
  );
}
