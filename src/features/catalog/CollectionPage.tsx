import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { NotFound } from '@/features/shared/NotFound';
import { useProgress } from '@/features/shared/useProgress';
import { useText } from '@/i18n';
import { collectionById } from './collections';
import { GameCard } from './GameCard';

/** One area (or a cross-area view such as spatial reasoning), with its games. */
export function CollectionPage() {
  const { collectionId } = useParams();
  const collection = collectionById(collectionId);
  const { modules, progress } = useServices();
  const { preferences } = usePreferences();
  const { state } = useProgress(progress);
  const { t } = useTranslation('catalog');
  const tx = useText();
  if (!collection) return <NotFound message={t('collection.notFound')} />;
  const games = modules.map((m) => m.definition).filter(collection.includes);

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <Icon name={collection.icon} className="h-4 w-4" /> {t('collection.eyebrow')}
          </span>
        }
        title={tx(collection.title)}
        description={tx(collection.description)}
        actions={
          <ButtonLink to="/games" variant="secondary">
            {t('collection.all')}
          </ButtonLink>
        }
      />
      {games.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-ink-muted">
          {t('collection.empty')}
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-muted">
            {t('collection.count', { count: games.length })}
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
