import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { pathById, PATHS } from '@/content/paths';
import {
  continueTarget,
  dailyChallenge,
  recommendTraining,
  type TrainingSuggestion,
} from '@/domain/insights';
import { weekSummary, type UserProfile } from '@/domain/profile';
import { QUICK_SESSION_MINUTES } from '@/domain/preferences';
import { unlockedLevels, type UserProgress } from '@/domain/progress';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { ButtonLink } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { StatTile } from '@/components/ui/StatTile';
import { WeekStrip } from '@/features/dashboard/WeekStrip';
import { catalogEntries, categoriesFor, dailyPool } from '@/features/shared/catalog';
import { CATEGORIES, GENERAL_CATEGORIES } from '@/features/shared/categories';
import { dayKeyOf } from '@/features/shared/days';
import { LoadError } from '@/features/shared/LoadError';
import { PageLoading } from '@/features/shared/PageLoading';
import { useAppData } from '@/features/shared/useAppData';
import { useFormat, useText } from '@/i18n';

const PATH_ICONS: Readonly<Record<string, IconName>> = {
  kids: 'kids',
  teens: 'teens',
  adults: 'adults',
  seniors: 'seniors',
  programmers: 'code',
};

function Panel({
  title,
  id,
  children,
  action,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Dashboard({ progress, profile }: { progress: UserProgress; profile: UserProfile }) {
  const { modules, getModule, clock } = useServices();
  const { preferences } = usePreferences();
  const { t } = useTranslation('home');
  const tx = useText();
  const format = useFormat();
  const now = clock.now();
  const today = dayKeyOf(now);
  const path = pathById(preferences.path);
  const name = (id: string) => {
    const definition = getModule(id)?.definition;
    return definition ? tx(definition.name) : id;
  };
  const exists = (id: string) => getModule(id) !== undefined;

  const resume = continueTarget(progress, exists, preferences.freePlay);
  const pool = dailyPool(modules, path);
  const daily = pool.length > 0 ? dailyChallenge(today, pool, progress.games) : null;
  const dailyDone = profile.daily[today];
  const suggestions = recommendTraining({
    catalog: catalogEntries(modules),
    progress,
    featured: path?.featured ?? [],
    categories: categoriesFor(path),
    now,
    freePlay: preferences.freePlay,
  }).filter((s) => exists(s.gameId));

  const played = new Set(progress.recentSessions.map((s) => s.gameId));
  for (const id of Object.keys(progress.games)) played.add(id);
  const openedLevels = [...played].reduce(
    (sum, id) =>
      sum + (exists(id) ? unlockedLevels(progress.games[id], preferences.freePlay).length : 0),
    0,
  );
  const todayMs = progress.recentSessions
    .filter((s) => dayKeyOf(s.endedAt) === today)
    .reduce((sum, s) => sum + s.durationMs, 0);
  const goal = preferences.dailyGoalMinutes;
  const returning = progress.totals.sessions > 0;
  const week = weekSummary(profile, today);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-5 rounded-3xl border border-line bg-gradient-to-br from-surface via-surface to-brand/10 p-6 sm:p-8">
        <p className="text-sm font-medium text-brand-strong">
          {returning ? t('home.welcomeBack') : t('home.welcome')}
          {path ? t('home.routeSuffix', { route: tx(path.name) }) : ''}
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
          {t('home.title')}
        </h1>
        <p className="max-w-2xl text-ink-soft">{t('home.lead')}</p>
        <div className="flex flex-wrap gap-3">
          {resume ? (
            <ButtonLink to={`/games/${resume.gameId}/play/${resume.level}`}>
              <Icon name="play" /> {t('home.continueGame', { game: name(resume.gameId) })}
            </ButtonLink>
          ) : (
            <ButtonLink to={suggestions[0] ? `/games/${suggestions[0].gameId}` : '/games'}>
              <Icon name="play" /> {t('home.startFirst')}
            </ButtonLink>
          )}
          <ButtonLink to="/quick" variant="secondary">
            <Icon name="timer" /> {t('home.quickSession')}
          </ButtonLink>
          {!path && (
            <ButtonLink to="/start" variant="ghost">
              {t('home.chooseRoute')}
            </ButtonLink>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="continue-title"
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 id="continue-title" className="flex items-center gap-2 font-semibold text-ink">
            <Icon name="play" className="h-5 w-5 text-brand" /> {t('home.continue.title')}
          </h2>
          {resume ? (
            <>
              <p className="text-ink-soft">
                <Trans
                  t={t}
                  i18nKey="home.continue.where"
                  values={{
                    game: name(resume.gameId),
                    level: resume.session.level,
                    when: format.relativeDay(resume.session.endedAt, now),
                  }}
                  components={{ b: <span className="font-semibold text-ink" /> }}
                />
              </p>
              <p className="text-sm text-ink-muted">
                {resume.cleared
                  ? t('home.continue.lastCleared', {
                      accuracy: format.percent(resume.session.accuracy),
                      level: resume.level,
                    })
                  : t('home.continue.lastRepeat', {
                      accuracy: format.percent(resume.session.accuracy),
                    })}
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <ButtonLink to={`/games/${resume.gameId}/play/${resume.level}`}>
                  {t('home.continue.playLevel', { level: resume.level })}
                </ButtonLink>
                <ButtonLink to={`/games/${resume.gameId}`} variant="ghost">
                  {t('home.continue.details')}
                </ButtonLink>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft">{t('home.continue.empty')}</p>
          )}
        </section>

        <section
          aria-labelledby="daily-title"
          className="flex flex-col gap-3 rounded-2xl border border-glow/30 bg-glow/5 p-5"
        >
          <h2 id="daily-title" className="flex items-center gap-2 font-semibold text-ink">
            <Icon name="calendar" className="h-5 w-5 text-glow" /> {t('home.daily.title')}
          </h2>
          {daily ? (
            <>
              <p className="text-ink-soft">
                <Trans
                  t={t}
                  i18nKey="home.daily.today"
                  values={{ game: name(daily.gameId), level: daily.level }}
                  components={{ b: <span className="font-semibold text-ink" /> }}
                />
              </p>
              <p className="text-sm text-ink-muted">
                {dailyDone
                  ? t('home.daily.done', { performance: dailyDone.performanceIndex })
                  : t('home.daily.pending')}
              </p>
              <div className="mt-auto">
                <ButtonLink to="/daily" variant={dailyDone ? 'secondary' : 'primary'}>
                  {dailyDone ? t('home.daily.seeResult') : t('home.daily.play')}
                </ButtonLink>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-muted">{t('home.daily.none')}</p>
          )}
        </section>

        <section
          aria-labelledby="quick-title"
          className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
        >
          <h2 id="quick-title" className="flex items-center gap-2 font-semibold text-ink">
            <Icon name="timer" className="h-5 w-5 text-cat-patterns" /> {t('home.quick.title')}
          </h2>
          <p className="text-sm text-ink-soft">{t('home.quick.body')}</p>
          <ul className="mt-auto grid grid-cols-4 gap-2">
            {QUICK_SESSION_MINUTES.map((minutes) => (
              <li key={minutes}>
                <Link
                  to={`/quick?minutes=${minutes}`}
                  className="flex flex-col items-center rounded-xl border border-line bg-raised py-2 hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span className="text-lg font-semibold text-ink">{minutes}</span>
                  <span className="text-xs text-ink-muted">{t('home.quick.min')}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {suggestions.length > 0 && (
        <Panel id="recommended-title" title={t('home.recommended')}>
          <ul className="grid gap-3 md:grid-cols-3">
            {suggestions.map((s) => (
              <Suggestion key={s.gameId} suggestion={s} name={name(s.gameId)} />
            ))}
          </ul>
        </Panel>
      )}

      <Panel
        id="progress-title"
        title={t('home.progress.title')}
        action={
          <Link to="/progress" className="text-sm text-brand hover:underline">
            {t('home.progress.seeAll')}
          </Link>
        }
      >
        {returning ? (
          <>
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile
                label={t('home.progress.sessions')}
                value={format.number(progress.totals.sessions)}
              />
              <StatTile
                label={t('home.progress.practiceTime')}
                value={format.duration(progress.totals.practiceMs)}
              />
              <StatTile
                label={t('home.progress.explored')}
                value={`${format.number(played.size)}/${format.number(modules.length)}`}
              />
              <StatTile
                label={t('home.progress.levelsOpen')}
                value={format.number(openedLevels)}
                hint={t('home.progress.levelsOpenHint')}
              />
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4">
              <WeekStrip week={week} />
              {goal !== null && (
                <p className="text-sm text-ink-soft">
                  {todayMs >= goal * 60_000
                    ? t('home.progress.todayReached', {
                        minutes: Math.round(todayMs / 60_000),
                        goal,
                      })
                    : t('home.progress.today', { minutes: Math.round(todayMs / 60_000), goal })}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-ink-muted">
            {t('home.progress.empty')}
          </p>
        )}
      </Panel>

      <Panel
        id="areas-title"
        title={t('home.areas.title')}
        action={
          <Link to="/games" className="text-sm text-brand hover:underline">
            {t('home.areas.all')}
          </Link>
        }
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {GENERAL_CATEGORIES.map((category) => {
            const meta = CATEGORIES[category];
            const count = modules.filter((m) => m.definition.meta.category === category).length;
            return (
              <li key={category}>
                <Link
                  to={`/train/${category}`}
                  className={`flex h-full flex-col gap-2 rounded-2xl border ${meta.ring} ${meta.soft} p-4 hover:bg-raised focus-visible:outline-2 focus-visible:outline-brand`}
                >
                  <Icon name={meta.icon} className={`h-7 w-7 ${meta.text}`} />
                  <span className="font-semibold text-ink">{tx(meta.label)}</span>
                  <span className="text-sm text-ink-soft">{tx(meta.summary)}</span>
                  <span className="mt-auto text-xs text-ink-muted">
                    {t('home.areas.games', { count })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel id="routes-title" title={t('home.routes.title')}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PATHS.map((p) => (
            <li key={p.id}>
              <Link
                to={`/paths/${p.id}`}
                aria-current={p.id === path?.id ? 'true' : undefined}
                className={`flex h-full flex-col gap-2 rounded-2xl border p-4 hover:bg-raised focus-visible:outline-2 focus-visible:outline-brand ${
                  p.id === path?.id ? 'border-brand bg-brand/10' : 'border-line bg-surface'
                }`}
              >
                <Icon name={PATH_ICONS[p.id] ?? 'adults'} className="h-6 w-6 text-brand" />
                <span className="font-semibold text-ink">
                  {tx(p.name)}
                  {p.id === path?.id && (
                    <span className="ml-2 text-xs text-brand">{t('home.routes.yours')}</span>
                  )}
                </span>
                <span className="text-sm text-ink-soft">{tx(p.tagline)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel id="learn-title" title={t('home.programming.title')}>
        <div className="flex flex-col gap-3 rounded-2xl border border-cat-programming/30 bg-cat-programming/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm text-ink-soft">{t('home.programming.body')}</p>
          <div className="flex gap-2">
            <ButtonLink to="/learn" variant="secondary">
              {t('home.programming.course')}
            </ButtonLink>
            <ButtonLink to="/train/programming" variant="ghost">
              {t('home.programming.games')}
            </ButtonLink>
          </div>
        </div>
      </Panel>
    </div>
  );
}

const SUGGESTION_LABEL: Readonly<Record<TrainingSuggestion['kind'], string>> = {
  'level-up': 'home.suggestion.levelUp',
  variety: 'home.suggestion.variety',
  discover: 'home.suggestion.discover',
  start: 'home.suggestion.start',
};

function Suggestion({ suggestion, name }: { suggestion: TrainingSuggestion; name: string }) {
  const { t } = useTranslation('home');
  const tx = useText();
  return (
    <li>
      <Link
        to={`/games/${suggestion.gameId}`}
        className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-4 hover:border-line-strong hover:bg-raised focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="text-xs font-semibold tracking-wide text-brand-strong uppercase">
          {t(SUGGESTION_LABEL[suggestion.kind])}
        </span>
        <span className="font-semibold text-ink">
          {t('home.suggestion.game', { game: name, level: suggestion.level })}
        </span>
        <span className="text-sm text-ink-soft">{tx(suggestion.reason)}</span>
      </Link>
    </li>
  );
}

export function HomePage() {
  const data = useAppData();
  if (data.status === 'loading') return <PageLoading />;
  if (data.status === 'error') return <LoadError onRetry={data.reload} />;
  return <Dashboard progress={data.progress} profile={data.profile} />;
}
