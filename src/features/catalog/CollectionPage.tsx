import { useParams } from 'react-router';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { NotFound } from '@/features/shared/NotFound';
import { useProgress } from '@/features/shared/useProgress';
import { collectionById } from './collections';
import { GameCard } from './GameCard';

/** One area (or a cross-area view such as spatial reasoning), with its games. */
export function CollectionPage() {
  const { collectionId } = useParams();
  const collection = collectionById(collectionId);
  const { modules, progress } = useServices();
  const { preferences } = usePreferences();
  const { state } = useProgress(progress);
  if (!collection) return <NotFound message="This area does not exist." />;
  const games = modules.map((m) => m.definition).filter(collection.includes);

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <Icon name={collection.icon} className="h-4 w-4" /> Training area
          </span>
        }
        title={collection.title}
        description={collection.description}
        actions={
          <ButtonLink to="/games" variant="secondary">
            All activities
          </ButtonLink>
        }
      />
      {games.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-ink-muted">
          No games in this area yet.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-muted">
            {games.length} {games.length === 1 ? 'game' : 'games'} · every game has ten levels;
            level 1 is always open.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {games.map((d) => (
              <li key={d.id}>
                <GameCard
                  definition={d}
                  progress={state.status === 'ready' ? state.progress.games[d.id] : undefined}
                  freePlay={preferences.freePlay}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
