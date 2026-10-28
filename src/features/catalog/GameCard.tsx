import { Link } from 'react-router';
import { isLevelCleared, unlockedLevels, type GameProgress } from '@/domain/progress';
import { DIFFICULTY_LEVELS } from '@/domain/shared';
import type { GameDefinition } from '@/domain/game';
import { Icon } from '@/components/ui/Icon';
import { CATEGORIES } from '@/features/shared/categories';

/** One game in a list: what it is, how long it takes and where you are in it. */
export function GameCard({
  definition,
  progress,
  freePlay,
  badge,
}: {
  readonly definition: GameDefinition;
  readonly progress: GameProgress | undefined;
  readonly freePlay: boolean;
  readonly badge?: string;
}) {
  const meta = CATEGORIES[definition.meta.category];
  const cleared = DIFFICULTY_LEVELS.filter((l) => isLevelCleared(progress?.[l])).length;
  const open = unlockedLevels(progress, freePlay).length;
  const played = progress !== undefined && Object.keys(progress).length > 0;
  return (
    <Link
      to={`/games/${definition.id}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong hover:bg-raised focus-visible:outline-2 focus-visible:outline-brand"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase ${meta.text}`}
        >
          <Icon name={meta.icon} className="h-4 w-4" />
          {meta.label}
        </span>
        {badge !== undefined && (
          <span className="rounded-full bg-glow/15 px-2 py-0.5 text-xs font-medium text-glow">
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-ink group-hover:text-brand-strong">
          {definition.name}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">{definition.tagline}</p>
      </div>
      <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-ink-muted">
        <div className="flex gap-1">
          <dt className="sr-only">Duration</dt>
          <dd>~{definition.meta.estimatedMinutes} min</dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">Progress</dt>
          <dd>{played ? `${cleared}/10 cleared · ${open} open` : 'Not played yet'}</dd>
        </div>
        {definition.meta.relaxedFriendly && (
          <div>
            <dt className="sr-only">Timing</dt>
            <dd>No-rush mode</dd>
          </div>
        )}
      </dl>
    </Link>
  );
}
