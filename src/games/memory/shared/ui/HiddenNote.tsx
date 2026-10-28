/** Placeholder shown while answering: the studied material is hidden. */
export function HiddenNote({ children }: { readonly children: string }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line p-4 text-center">
      <span aria-hidden="true" className="text-2xl text-ink-muted">
        ?
      </span>
      <p className="text-sm text-ink-soft">{children}</p>
    </div>
  );
}
