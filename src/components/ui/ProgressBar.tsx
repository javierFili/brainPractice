export function ProgressBar({
  value,
  max,
  label,
  tone = 'bg-sky-400',
}: {
  value: number;
  max: number;
  label: string;
  tone?: string;
}) {
  const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
    >
      <div
        className={`h-full rounded-full ${tone} transition-[width] duration-300`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
