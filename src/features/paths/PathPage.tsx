import { Trans, useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { pathById, PATHS } from '@/content/paths';
import { routeDefaults } from '@/domain/preferences';
import { suggestedLevel } from '@/domain/progress';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { GameCard } from '@/features/catalog/GameCard';
import { NotFound } from '@/features/shared/NotFound';
import { useProgress } from '@/features/shared/useProgress';
import { joinText, msg, type Text } from '@/domain/shared';
import { useText } from '@/i18n';

const SETTING_WORDS: Readonly<Record<string, Text>> = {
  textSize: msg('catalog:path.settings.textSize'),
  comfort: msg('catalog:path.settings.comfort'),
  relaxedByDefault: msg('catalog:path.settings.relaxedByDefault'),
  freePlay: msg('catalog:path.settings.freePlay'),
};

/** A route: goals, curated games from the shared catalog, and optional suggested settings. */
export function PathPage() {
  const { pathId } = useParams();
  const path = pathById(pathId);
  const { getModule, progress } = useServices();
  const { preferences, update } = usePreferences();
  const { state } = useProgress(progress);
  const { t } = useTranslation('catalog');
  const tx = useText();
  if (!path) return <NotFound message={t('path.notFound')} />;

  const games = path.featured.flatMap((id) => {
    const module = getModule(id);
    return module ? [module.definition] : [];
  });
  const chosen = preferences.path === path.id;
  const defaults = routeDefaults(path.id);
  const settingNames = Object.keys(defaults).map((k) => SETTING_WORDS[k] ?? k);
  const first = games.find((g) => {
    const record = state.status === 'ready' ? state.progress.games[g.id] : undefined;
    return record === undefined;
  });
  const firstGame = first ?? games[0];

  return (
    <>
      <PageHeader
        eyebrow={t('path.eyebrow')}
        title={tx(path.name)}
        description={tx(path.intro)}
        actions={
          chosen ? (
            <Button
              variant="ghost"
              onClick={() => {
                update({ path: null });
              }}
            >
              {t('path.leave')}
            </Button>
          ) : (
            <Button
              onClick={() => {
                update({ path: path.id, ...defaults });
              }}
            >
              {t('path.choose')}
            </Button>
          )
        }
      />
      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <section
          aria-labelledby="goals-title"
          className="rounded-2xl border border-line bg-surface p-5"
        >
          <h2 id="goals-title" className="mb-3 font-semibold text-ink">
            {t('path.offers')}
          </h2>
          <ul className="flex flex-col gap-2">
            {path.goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-ink-soft">
                <Icon name="check" className="mt-0.5 h-5 w-5 text-success" />
                {tx(goal)}
              </li>
            ))}
          </ul>
          {firstGame && (
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink
                to={`/games/${firstGame.id}/play/${suggestedLevel(state.status === 'ready' ? state.progress.games[firstGame.id] : undefined)}`}
              >
                <Icon name="play" /> {t('path.startWith', { game: tx(firstGame.name) })}
              </ButtonLink>
              <ButtonLink to="/quick" variant="secondary">
                {t('path.mixed', { count: path.suggestedMinutes })}
              </ButtonLink>
            </div>
          )}
        </section>
        <aside
          aria-label={t('path.about')}
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-sm"
        >
          <p className="font-semibold text-ink">
            {chosen ? t('path.yours') : t('path.goodToKnow')}
          </p>
          {path.notes.map((note, i) => (
            <p key={i} className="text-ink-soft">
              {tx(note)}
            </p>
          ))}
          {settingNames.length > 0 && (
            <p className="text-ink-muted">
              <Trans
                t={t}
                i18nKey="path.turnsOn"
                values={{ settings: tx(joinText(settingNames, ', ')) }}
                components={{ link: <Link to="/settings" className="text-brand underline" /> }}
              />
            </p>
          )}
          <p className="text-ink-muted">{t('path.onlySuggests')}</p>
        </aside>
      </div>
      <h2 className="mb-3 text-lg font-semibold text-ink">{t('path.activities')}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((d, i) => (
          <li key={d.id}>
            <GameCard
              definition={d}
              progress={state.status === 'ready' ? state.progress.games[d.id] : undefined}
              freePlay={preferences.freePlay}
              {...(i < 3 ? { badge: t('path.startHere') } : {})}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function PathsIndexPage() {
  const { preferences } = usePreferences();
  const { t } = useTranslation('catalog');
  const tx = useText();
  return (
    <>
      <PageHeader
        eyebrow={t('paths.eyebrow')}
        title={t('paths.title')}
        description={t('paths.description')}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PATHS.map((p) => (
          <li key={p.id}>
            <Link
              to={`/paths/${p.id}`}
              className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-5 hover:bg-raised focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span className="text-lg font-semibold text-ink">
                {tx(p.name)}{' '}
                {preferences.path === p.id && (
                  <span className="text-sm text-brand">{t('paths.yours')}</span>
                )}
              </span>
              <span className="text-ink-soft">{tx(p.tagline)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
