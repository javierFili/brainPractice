import { useText } from '@/i18n';
import type { EverydayObject } from '../content/objects';

/** An everyday object as a large emoji with its name as the accessible label. */
export function ObjectFace({
  item,
  className = 'text-4xl',
  showName = false,
}: {
  readonly item: EverydayObject;
  readonly className?: string;
  readonly showName?: boolean;
}) {
  const name = useText()(item.label);
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span role="img" aria-label={name} className={`leading-none ${className}`}>
        {item.emoji}
      </span>
      {showName && (
        <span aria-hidden="true" className="text-xs text-ink-muted">
          {name}
        </span>
      )}
    </span>
  );
}
