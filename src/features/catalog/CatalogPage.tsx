import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AUDIENCES, GAME_CATEGORIES, type Audience, type GameCategory } from '@/domain/game';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { CATEGORIES } from '@/features/shared/categories';
import { useProgress } from '@/features/shared/useProgress';
import { useText } from '@/i18n';
import { GameCard } from './GameCard';

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
  const { t } = useTranslation('catalog');
  const tx = useText();

  // Searches what the reader sees (current language) plus the stable skill ids.
  const text = query.trim().toLocaleLowerCase();
  const games = modules
    .map((m) => m.definition)
    .filter(
      (d) =>
        (category === 'all' || d.meta.category === category) &&
        (audience === 'all' || d.meta.audiences.includes(audience)) &&
        (!noRush || d.meta.relaxedFriendly) &&
        (text === '' ||
          [
            tx(d.name),
            tx(d.tagline),
            tx(d.description),
            ...d.skills,
            ...d.skills.map((skill) => t(`common:skills.${skill}`)),
          ]
            .join(' ')
            .toLocaleLowerCase()
            .includes(text)),
    );

  return (
    <>
      <PageHeader
        eyebrow={t('catalog.eyebrow')}
        title={t('catalog.title')}
        description={t('catalog.description', {
          count: modules.length,
          areas: GAME_CATEGORIES.length,
        })}
      />
      <form
        role="search"
        aria-label={t('catalog.filter')}
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="mb-6 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <label htmlFor={ids.search} className="flex flex-col gap-1 text-xs text-ink-muted">
          {t('catalog.search')}
          <span className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-ink-muted"
            />
            <input
              id={ids.search}
              type="search"
              value={query}
              placeholder={t('catalog.searchPlaceholder')}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              className={`${selectClass} w-full pl-9`}
            />
          </span>
        </label>
        <label htmlFor={ids.category} className="flex flex-col gap-1 text-xs text-ink-muted">
          {t('catalog.area')}
          <select
            id={ids.category}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as GameCategory | 'all');
            }}
            className={selectClass}
          >
            <option value="all">{t('catalog.allAreas')}</option>
            {GAME_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tx(CATEGORIES[c].label)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={ids.audience} className="flex flex-col gap-1 text-xs text-ink-muted">
          {t('catalog.suitedTo')}
          <select
            id={ids.audience}
            value={audience}
            onChange={(e) => {
              setAudience(e.target.value as Audience | 'all');
            }}
            className={selectClass}
          >
            <option value="all">{t('catalog.everyone')}</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {t(`common:audiences.${a}`)}
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
          {t('catalog.noRush')}
        </label>
      </form>
      <p role="status" className="mb-3 text-sm text-ink-muted">
        {games.length === modules.length
          ? t('catalog.count', { count: games.length })
          : t('catalog.countOf', { count: modules.length, shown: games.length })}
      </p>
      {games.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-ink-muted">
          {t('catalog.empty')}
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
