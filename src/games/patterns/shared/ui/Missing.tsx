/** The "?" placeholder for the part the player must find. */
export function Missing({
  label = 'Missing (this is what you choose)',
  className = 'h-12 w-12 sm:h-14 sm:w-14',
}: {
  readonly label?: string;
  readonly className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={`flex ${className} items-center justify-center rounded-lg border-2 border-dashed border-glow/70 bg-glow/10 text-2xl font-bold text-glow`}
    >
      <span aria-hidden="true">?</span>
    </span>
  );
}
