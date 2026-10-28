import { useId, useState } from 'react';
import { AUDIENCES, GAME_CATEGORIES, type Audience, type GameCategory } from '@/domain/game';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { CATEGORIES } from '@/features/shared/categories';
import { useProgress } from '@/features/shared/useProgress';
import { GameCard } from './GameCard';

const AUDIENCE_LABEL: Readonly<Record<Audience, string>> = {
  kids: 'Kids',
  teens: 'Teens',
  adults: 'Adults',
  seniors: 'Seniors',
  programmers: 'Programmers',
};

const selectClass =
  'rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand';

/** Every game, filterable by area, route and timing, with a text search. */
export function CatalogPage() {
  const { modules, progress } = useServices();
  const { preferences } = usePreferences();
  const { state } = useProgress(progress);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GameCategory | 'all'>('all');
  const [audience, setAudience] = useState<Audience | 'all'>('all');
  const [noRush, setNoRush] = useState(false);
  const ids = { search: useId(), category: useId(), audience: useId(), rush: useId() };

  const text = query.trim().toLowerCase();
  const games = modules
    .map((m) => m.definition)
    .filter(
      (d) =>
        (category === 'all' || d.meta.category === category) &&
        (audience === 'all' || d.meta.audiences.includes(audience)) &&
        (!noRush || d.meta.relaxedFriendly) &&
        (text === '' ||
          `${d.name} ${d.tagline} ${d.description} ${d.skills.join(' ')}`
            .toLowerCase()
            .includes(text)),
    );

  return (
    <>
      <PageHeader
        eyebrow="Training"
        title="All activities"
        description={`${modules.length} games in ${GAME_CATEGORIES.length} areas. Each has ten levels, explains its rules before you start and saves your results on this device.`}
      />
      <form
        role="search"
        aria-label="Filter activities"
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="mb-6 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <label htmlFor={ids.search} className="flex flex-col gap-1 text-xs text-ink-muted">
          Search
          <span className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-ink-muted"
            />
            <input
              id={ids.search}
              type="search"
              value={query}
              placeholder="memory, shapes, numbers…"
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              className={`${selectClass} w-full pl-9`}
            />
          </span>
        </label>
        <label htmlFor={ids.category} className="flex flex-col gap-1 text-xs text-ink-muted">
          Area
          <select
            id={ids.category}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as GameCategory | 'all');
            }}
            className={selectClass}
          >
            <option value="all">All areas</option>
            {GAME_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c].label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={ids.audience} className="flex flex-col gap-1 text-xs text-ink-muted">
          Suited to
          <select
            id={ids.audience}
            value={audience}
            onChange={(e) => {
              setAudience(e.target.value as Audience | 'all');
            }}
            className={selectClass}
          >
            <option value="all">Everyone</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label
          htmlFor={ids.rush}
          className="flex items-center gap-2 self-end pb-2 text-sm text-ink-soft"
        >
          <input
            id={ids.rush}
            type="checkbox"
            checked={noRush}
            onChange={(e) => {
              setNoRush(e.target.checked);
            }}
            className="h-4 w-4 accent-brand"
          />
          Works without time limits
        </label>
      </form>
      <p role="status" className="mb-3 text-sm text-ink-muted">
        {games.length === modules.length
          ? `${games.length} games`
          : `${games.length} of ${modules.length} games`}
      </p>
      {games.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-ink-muted">
          No game matches these filters. Try clearing the search or choosing “All areas”.
        </p>
      ) : (
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
      )}
    </>
  );
}
