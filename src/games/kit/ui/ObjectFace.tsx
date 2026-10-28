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
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span role="img" aria-label={item.name} className={`leading-none ${className}`}>
        {item.emoji}
      </span>
      {showName && (
        <span aria-hidden="true" className="text-xs text-ink-muted">
          {item.name}
        </span>
      )}
    </span>
  );
}
