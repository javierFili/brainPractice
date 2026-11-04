import { useId, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { levelTrend, milestones } from '@/domain/insights';
import type { UserProfile } from '@/domain/profile';
import { isLevelCleared, unlockedLevels, type UserProgress } from '@/domain/progress';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { StatTile } from '@/components/ui/StatTile';
import { CATEGORIES, GENERAL_CATEGORIES } from '@/features/shared/categories';
import { useFormat, useText } from '@/i18n';
import { LoadError } from '@/features/shared/LoadError';
import { PageLoading } from '@/features/shared/PageLoading';
import { useAppData } from '@/features/shared/useAppData';

/** Small inline trend of performance values (0–100), oldest to newest. */
export function Sparkline({ values, label }: { values: readonly number[]; label: string }) {
  if (values.length < 2) return <span className="text-xs text-ink-muted">—</span>;
  const width = 96;
  const height = 28;
  const step = width / (values.length - 1);
  const points = values.map(
    (v, i) => `${(i * step).toFixed(1)},${(height - (v / 100) * height).toFixed(1)}`,
  );
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-24" role="img" aria-label={label}>
      <polyline
        points={points.join(' ')}
        fill="none"
        className="stroke-brand"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function History({ progress }: { progress: UserProgress }) {
  const { t } = useTranslation('progress');
  const tx = useText();
  const format = useFormat();
  const { getModule } = useServices();
  const [game, setGame] = useState('all');
  const id = useId();
  const games = [...new Set(progress.recentSessions.map((s) => s.gameId))].filter((g) =>
    getModule(g),
  );
  const rows = progress.recentSessions.filter(
    (s) => getModule(s.gameId) && (game === 'all' || s.gameId === game),
  );
  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="history-title" className="text-lg font-semibold text-ink">
          {t('history.title')}
        </h2>
        <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink-muted">
          {t('history.game')}
          <select
            id={id}
            value={game}
            onChange={(e) => {
              setGame(e.target.value);
            }}
            className="rounded-lg border border-line bg-raised px-3 py-1.5 text-ink"
          >
            <option value="all">{t('history.allGames')}</option>
            {games.map((g) => (
              <option key={g} value={g}>
                {tx(getModule(g)?.definition.name ?? g)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">{t('history.caption')}</caption>
          <thead className="bg-surface text-xs text-ink-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                {t('history.date')}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t('history.game')}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t('history.level')}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t('history.accuracy')}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t('history.performance')}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t('history.duration')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((s) => (
              <tr key={`${s.gameId}-${s.endedAt}`} className="border-t border-line">
                <td className="px-4 py-2 text-ink-soft">{format.date(s.endedAt)}</td>
                <td className="px-4 py-2 text-ink">
                  <Link to={`/games/${s.gameId}`} className="hover:underline">
                    {tx(getModule(s.gameId)?.definition.name ?? s.gameId)}
                  </Link>
                  {s.assisted && (
                    <span className="ml-2 text-xs text-ink-muted">{t('history.relaxed')}</span>
                  )}
                  {!s.completed && (
                    <span className="ml-2 text-xs text-warning">{t('history.endedEarly')}</span>
                  )}
                </td>
                <td className="px-4 py-2 font-mono">{s.level}</td>
                <td className="px-4 py-2 font-mono">{format.percent(s.accuracy)}</td>
                <td className="px-4 py-2 font-mono">{s.performanceIndex}</td>
                <td className="px-4 py-2 font-mono">{format.duration(s.durationMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 50 && (
        <p className="text-xs text-ink-muted">
          {t('history.showingLatest', { shown: 50, total: rows.length })}
        </p>
      )}
    </section>
  );
}

function Overview({ progress, profile }: { progress: UserProgress; profile: UserProfile }) {
  const { t } = useTranslation('progress');
  const tx = useText();
  const format = useFormat();
  const { modules, getModule } = useServices();
  const { preferences } = usePreferences();
  const playedIds = [
    ...new Set([...Object.keys(progress.games), ...progress.recentSessions.map((s) => s.gameId)]),
  ].filter((id) => getModule(id));
  const categoryOf = (id: string) => getModule(id)?.definition.meta.category;
  const badges = milestones({ progress, profile, categoryOf });
  const earned = badges.filter((b) => b.achieved);

  const sessionsByCategory = GENERAL_CATEGORIES.map((c) => ({
    category: c,
    count: progress.recentSessions.filter((s) => categoryOf(s.gameId) === c).length,
  }));
  const programming = progress.recentSessions.filter(
    (s) => categoryOf(s.gameId) === 'programming',
  ).length;
  const maxCount = Math.max(1, ...sessionsByCategory.map((x) => x.count), programming);
  const plays = new Map<string, number>();
  for (const s of progress.recentSessions) plays.set(s.gameId, (plays.get(s.gameId) ?? 0) + 1);
  const mostPlayed = [...plays.entries()]
    .filter(([id]) => getModule(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const openLevels = playedIds.reduce(
    (sum, id) => sum + unlockedLevels(progress.games[id], preferences.freePlay).length,
    0,
  );
  const clearedLevels = Object.values(progress.games).reduce(
    (sum, g) => sum + DIFFICULTY_LEVELS.filter((l) => isLevelCleared(g[l])).length,
    0,
  );
  const dailies = Object.keys(profile.daily).length;

  return (
    <div className="flex flex-col gap-10">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t('stats.sessions')} value={format.number(progress.totals.sessions)} />
        <StatTile
          label={t('stats.practiceTime')}
          value={format.duration(progress.totals.practiceMs)}
        />
        <StatTile
          label={t('stats.gamesExplored')}
          value={`${playedIds.length}/${modules.length}`}
        />
        <StatTile label={t('stats.levels')} value={`${openLevels} / ${clearedLevels}`} />
        <StatTile
          label={t('stats.activeDays')}
          value={profile.activeDays.length}
          hint={t('stats.activeDaysHint')}
        />
        <StatTile label={t('stats.daily')} value={dailies} />
        <StatTile label={t('stats.assessments')} value={progress.assessments?.length ?? 0} />
        <StatTile label={t('stats.milestones')} value={`${earned.length}/${badges.length}`} />
      </dl>

      <section aria-labelledby="distribution-title" className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 id="distribution-title" className="mb-4 font-semibold text-ink">
            {t('distribution.title')}
          </h2>
          <ul className="flex flex-col gap-3">
            {[...sessionsByCategory, { category: 'programming' as const, count: programming }].map(
              ({ category, count }) => (
                <li
                  key={category}
                  className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm"
                >
                  <span className={`flex items-center gap-1.5 ${CATEGORIES[category].text}`}>
                    <Icon name={CATEGORIES[category].icon} className="h-4 w-4" />
                    {tx(CATEGORIES[category].label)}
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-raised">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-mono text-ink-soft">{count}</span>
                </li>
              ),
            )}
          </ul>
          <p className="mt-3 text-xs text-ink-muted">{t('distribution.note')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-4 font-semibold text-ink">{t('mostPlayed.title')}</h2>
          {mostPlayed.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('mostPlayed.empty')}</p>
          ) : (
            <ol className="flex flex-col gap-2 text-sm">
              {mostPlayed.map(([id, count]) => (
                <li key={id} className="flex justify-between gap-3">
                  <Link to={`/games/${id}`} className="text-ink hover:underline">
                    {tx(getModule(id)?.definition.name ?? id)}
                  </Link>
                  <span className="font-mono text-ink-soft">{count}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section aria-labelledby="records-title" className="flex flex-col gap-3">
        <h2 id="records-title" className="text-lg font-semibold text-ink">
          {t('records.title')}
        </h2>
        <p className="text-sm text-ink-muted">{t('records.note')}</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {playedIds.map((id) => {
            const game = progress.games[id] ?? {};
            const levels = DIFFICULTY_LEVELS.filter((l) => game[l] !== undefined);
            const best = levels.reduce<DifficultyLevel | null>(
              (top, l) =>
                top === null ||
                (game[l]?.bestPerformanceIndex ?? 0) >= (game[top]?.bestPerformanceIndex ?? 0)
                  ? l
                  : top,
              null,
            );
            const latest = progress.recentSessions.find((s) => s.gameId === id);
            const trend = latest ? levelTrend(progress.recentSessions, id, latest.level) : [];
            const record = best === null ? undefined : game[best];
            return (
              <li
                key={id}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/games/${id}`} className="font-semibold text-ink hover:underline">
                    {tx(getModule(id)?.definition.name ?? id)}
                  </Link>
                  {latest && (
                    <Sparkline
                      values={trend}
                      label={t('records.trend', {
                        level: latest.level,
                        values: trend.map((v) => format.number(v)).join(', '),
                      })}
                    />
                  )}
                </div>
                {record && best !== null ? (
                  <p className="text-sm text-ink-soft">
                    {t('records.best', {
                      level: best,
                      performance: record.bestPerformanceIndex,
                      accuracy: format.percent(record.bestAccuracy),
                      points: format.points(record.bestScore),
                    })}
                    {record.bestMedianResponseMs !== null &&
                      ` · ${t('records.median', { time: format.ms(record.bestMedianResponseMs) })}`}
                  </p>
                ) : (
                  <p className="text-sm text-ink-muted">{t('records.none')}</p>
                )}
                <p className="text-xs text-ink-muted">
                  {t('records.cleared', {
                    levels:
                      DIFFICULTY_LEVELS.filter((l) => isLevelCleared(game[l])).join(', ') ||
                      t('records.clearedNone'),
                  })}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="milestones-title" className="flex flex-col gap-3">
        <h2 id="milestones-title" className="text-lg font-semibold text-ink">
          {t('milestonesTitle')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <li
              key={b.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 ${b.achieved ? 'border-glow/40 bg-glow/5' : 'border-line bg-surface'}`}
            >
              <Icon
                name={b.achieved ? 'trophy' : 'lock'}
                className={`mt-0.5 h-5 w-5 ${b.achieved ? 'text-glow' : 'text-ink-muted'}`}
              />
              <div>
                <p className="font-semibold text-ink">
                  {tx(b.title)}
                  <span className="sr-only">
                    {b.achieved ? t('milestoneAchieved') : t('milestoneNotYet')}
                  </span>
                </p>
                <p className="text-sm text-ink-soft">{tx(b.description)}</p>
                {!b.achieved && b.target > 1 && (
                  <p className="mt-1 text-xs text-ink-muted">
                    {b.current} / {b.target}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <History progress={progress} />
    </div>
  );
}

export function ProgressPage() {
  const { t } = useTranslation('progress');
  const data = useAppData();
  return (
    <>
      <PageHeader
        eyebrow={t('page.eyebrow')}
        title={t('page.title')}
        description={t('page.description')}
        actions={
          <ButtonLink to="/settings/data" variant="ghost">
            {t('page.manageData')}
          </ButtonLink>
        }
      />
      {data.status === 'loading' ? (
        <PageLoading />
      ) : data.status === 'error' ? (
        <LoadError onRetry={data.reload} />
      ) : data.progress.totals.sessions === 0 && data.progress.recentSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-ink-soft">
          <p>{t('page.empty')}</p>
          <ButtonLink to="/games" className="mt-4">
            {t('page.browse')}
          </ButtonLink>
        </div>
      ) : (
        <Overview progress={data.progress} profile={data.profile} />
      )}
    </>
  );
}
