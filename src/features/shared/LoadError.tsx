import { Button } from '@/components/ui/Button';

export function LoadError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/40 bg-danger/10 p-5 text-sm text-ink-soft"
    >
      <p className="font-semibold text-danger">Your saved progress could not be read.</p>
      <p className="mt-1">
        Nothing has been deleted. Try again, or check whether this browser allows site storage.
      </p>
      {onRetry && (
        <Button variant="secondary" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
