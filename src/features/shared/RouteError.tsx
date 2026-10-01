import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';

/** Shown instead of a screen that crashed; the app shell (navigation) stays usable. */
export function RouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);

  return (
    <div role="alert" className="mx-auto max-w-xl py-16 text-center">
      <p className="font-mono text-sm text-slate-500">error</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">Something went wrong</h1>
      <p className="mt-2 text-slate-400">
        This screen could not be displayed. Your saved progress is not affected.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button
          onClick={() => {
            window.location.reload();
          }}
        >
          Reload
        </Button>
        <ButtonLink to="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
      <details className="mt-8 text-left text-xs text-slate-500">
        <summary className="cursor-pointer">Technical details</summary>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 whitespace-pre-wrap">
          {detail}
        </pre>
      </details>
    </div>
  );
}
