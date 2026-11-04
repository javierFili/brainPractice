import { useId, type ReactNode } from 'react';
import { textId, type Text } from '@/domain/shared';
import { useText } from '@/i18n';

/** A titled block of content: headings name every part of a puzzle for screen-reader users. */
export function Panel({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <h3 id={id} className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Numbered clues or statements, in plain text. */
export function ClueList({
  clues,
  label,
}: {
  readonly clues: readonly Text[];
  readonly label: string;
}) {
  const tx = useText();
  return (
    <ol
      aria-label={label}
      className="flex list-decimal flex-col gap-1.5 rounded-lg border border-line bg-raised py-3 pr-3 pl-8 text-sm leading-relaxed text-ink sm:text-base"
    >
      {clues.map((clue, i) => (
        <li key={`${i}-${textId(clue)}`}>{tx(clue)}</li>
      ))}
    </ol>
  );
}

/** Small labelled tokens (names, items) shown in a wrapping row. */
export function Chips({
  items,
  label,
}: {
  readonly items: readonly Text[];
  readonly label: string;
}) {
  const tx = useText();
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={textId(item)}
          className="rounded-md border border-line bg-surface px-2.5 py-1 text-sm text-ink-soft"
        >
          {tx(item)}
        </li>
      ))}
    </ul>
  );
}
