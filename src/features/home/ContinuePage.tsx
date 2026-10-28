import { continueTarget } from '@/domain/insights';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { formatDate, formatPercent } from '@/features/shared/format';
import { LoadError } from '@/features/shared/LoadError';
import { PageLoading } from '@/features/shared/PageLoading';
import { useAppData } from '@/features/shared/useAppData';

/** Pick up where you left off: the last game, and the last few different games played. */
export function ContinuePage() {
  const data = useAppData();
  const { getModule } = useServices();
  const { preferences } = usePreferences();
  if (data.status === 'loading') return <PageLoading />;
  if (data.status === 'error') return <LoadError onRetry={data.reload} />;
  const exists = (id: string) => getModule(id) !== undefined;
  const target = continueTarget(data.progress, exists, preferences.freePlay);
  // Most recent session of each game, latest first.
  const latestFirst = data.progress.recentSessions
    .filter((s) => exists(s.gameId))
    .reduce<typeof data.progress.recentSessions>(
      (list, s) => (list.some((x) => x.gameId === s.gameId) ? list : [...list, s]),
      [],
    )
    .slice(0, 6);

  return (
    <>
      <PageHeader eyebrow="General" title="Continue training" />
      {target ? (
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-brand/40 bg-brand/10 p-6">
            <p className="text-sm text-brand-strong">Last activity</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">
              {getModule(target.gameId)?.definition.name}
            </h2>
            <p className="mt-2 text-ink-soft">
              Level {target.session.level} on {formatDate(target.session.endedAt)} ·{' '}
              {formatPercent(target.session.accuracy)} accuracy · performance{' '}
              {target.session.performanceIndex}/100
              {target.session.completed ? '' : ' · ended early'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink to={`/games/${target.gameId}/play/${target.level}`}>
                {target.level === target.session.level
                  ? `Repeat level ${target.level}`
                  : `Go to level ${target.level}`}
              </ButtonLink>
              <ButtonLink to={`/games/${target.gameId}`} variant="secondary">
                Choose another level
              </ButtonLink>
            </div>
          </section>
          {latestFirst.length > 1 && (
            <section aria-labelledby="recent-games">
              <h2 id="recent-games" className="mb-3 text-lg font-semibold text-ink">
                Recently played
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {latestFirst.slice(1).map((s) => (
                  <li key={s.gameId}>
                    <ButtonLink
                      to={`/games/${s.gameId}`}
                      variant="secondary"
                      className="w-full justify-between"
                    >
                      <span>{getModule(s.gameId)?.definition.name}</span>
                      <span className="text-xs text-ink-muted">level {s.level}</span>
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line p-6 text-ink-soft">
          <p>You have not played anything yet, so there is nothing to continue.</p>
          <div className="mt-4 flex gap-2">
            <ButtonLink to="/games">Browse activities</ButtonLink>
            <ButtonLink to="/quick" variant="secondary">
              Try a quick session
            </ButtonLink>
          </div>
        </div>
      )}
    </>
  );
}
