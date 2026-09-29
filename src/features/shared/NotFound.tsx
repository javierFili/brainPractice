import { ButtonLink } from '@/components/ui/Button';

export function NotFound({ message = 'This page does not exist.' }: { message?: string }) {
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-slate-500">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">Nothing here</h1>
      <p className="mt-2 text-slate-400">{message}</p>
      <ButtonLink to="/games" className="mt-6">
        Browse games
      </ButtonLink>
    </div>
  );
}
