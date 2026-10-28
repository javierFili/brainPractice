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

const SETTING_WORDS: Readonly<Record<string, string>> = {
  textSize: 'larger text',
  comfort: 'comfortable controls',
  relaxedByDefault: 'relaxed timing',
  freePlay: 'every level open',
};

/** A route: goals, curated games from the shared catalog, and optional suggested settings. */
export function PathPage() {
  const { pathId } = useParams();
  const path = pathById(pathId);
  const { getModule, progress } = useServices();
  const { preferences, update } = usePreferences();
  const { state } = useProgress(progress);
  if (!path) return <NotFound message="This route does not exist." />;

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
        eyebrow="Route"
        title={path.name}
        description={path.intro}
        actions={
          chosen ? (
            <Button
              variant="ghost"
              onClick={() => {
                update({ path: null });
              }}
            >
              Leave this route
            </Button>
          ) : (
            <Button
              onClick={() => {
                update({ path: path.id, ...defaults });
              }}
            >
              Make this my route
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
            What this route offers
          </h2>
          <ul className="flex flex-col gap-2">
            {path.goals.map((goal) => (
              <li key={goal} className="flex items-start gap-2 text-ink-soft">
                <Icon name="check" className="mt-0.5 h-5 w-5 text-success" />
                {goal}
              </li>
            ))}
          </ul>
          {firstGame && (
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink
                to={`/games/${firstGame.id}/play/${suggestedLevel(state.status === 'ready' ? state.progress.games[firstGame.id] : undefined)}`}
              >
                <Icon name="play" /> Start with {firstGame.name}
              </ButtonLink>
              <ButtonLink to="/quick" variant="secondary">
                {path.suggestedMinutes}-minute mixed session
              </ButtonLink>
            </div>
          )}
        </section>
        <aside
          aria-label="About this route"
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-sm"
        >
          <p className="font-semibold text-ink">{chosen ? 'This is your route' : 'Good to know'}</p>
          {path.notes.map((note) => (
            <p key={note} className="text-ink-soft">
              {note}
            </p>
          ))}
          {settingNames.length > 0 && (
            <p className="text-ink-muted">
              Choosing it turns on: {settingNames.join(', ')}. You can change each one in{' '}
              <Link to="/settings" className="text-brand underline">
                Settings
              </Link>
              .
            </p>
          )}
          <p className="text-ink-muted">
            A route only suggests games. Every game and level of the catalog stays available.
          </p>
        </aside>
      </div>
      <h2 className="mb-3 text-lg font-semibold text-ink">Activities in this route</h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((d, i) => (
          <li key={d.id}>
            <GameCard
              definition={d}
              progress={state.status === 'ready' ? state.progress.games[d.id] : undefined}
              freePlay={preferences.freePlay}
              {...(i < 3 ? { badge: 'Start here' } : {})}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function PathsIndexPage() {
  const { preferences } = usePreferences();
  return (
    <>
      <PageHeader
        eyebrow="Routes"
        title="Choose a route"
        description="Routes pick games and settings for different ages and interests. They are optional, can be changed any time, and never limit what you can play."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PATHS.map((p) => (
          <li key={p.id}>
            <Link
              to={`/paths/${p.id}`}
              className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-5 hover:bg-raised focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span className="text-lg font-semibold text-ink">
                {p.name}{' '}
                {preferences.path === p.id && (
                  <span className="text-sm text-brand">· your route</span>
                )}
              </span>
              <span className="text-ink-soft">{p.tagline}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
