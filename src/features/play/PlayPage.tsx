import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { parseSeed } from '@/domain/random';
import { parseDifficultyLevel, type DifficultyLevel } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { NotFound } from '@/features/shared/NotFound';
import { PageLoading } from '@/features/shared/PageLoading';
import { isLevelUnlocked, unlockedLevels } from '@/domain/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { useProgress } from '@/features/shared/useProgress';
import { PlaySession } from './PlaySession';

export function PlayPage() {
  const { gameId = '', level: rawLevel } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { getModule, progress } = useServices();
  const { state: stored } = useProgress(progress);
  const [attempt, setAttempt] = useState(0);
  const { preferences, ready } = usePreferences();

  const module = getModule(gameId);
  const level = parseDifficultyLevel(rawLevel);
  const rawSeed = params.get('seed');
  const seed = rawSeed === null ? null : parseSeed(rawSeed);
  if (!module || !level.ok || (seed !== null && !seed.ok)) {
    return <NotFound message="This game, level or seed does not exist." />;
  }
  // Levels open in order, also when the address is typed directly (free play opens all).
  if (level.value > 1 && !preferences.freePlay) {
    if (!ready || stored.status === 'loading') return <PageLoading />;
    const game = stored.status === 'ready' ? stored.progress.games[gameId] : undefined;
    if (stored.status === 'ready' && !isLevelUnlocked(game, level.value)) {
      const highest = unlockedLevels(game).at(-1) ?? 1;
      return (
        <>
          <PageHeader
            eyebrow={module.definition.name}
            title={`Level ${level.value} is not open yet`}
            description="Each level opens after a session of the level below with performance 50 or more, or after three completed sessions of it. Free play in Settings opens every level."
          />
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={`/games/${gameId}/play/${highest}`}>Play level {highest}</ButtonLink>
            <ButtonLink to="/settings" variant="secondary">
              Settings
            </ButtonLink>
          </div>
        </>
      );
    }
  }
  // An explicit ?assisted=0|1 wins; otherwise the person's default applies.
  const flag = params.get('assisted');
  if (flag === null && !ready) return <PageLoading />;
  const assisted = flag === null ? preferences.relaxedByDefault : flag === '1';

  const restart = ({ level: next, seed: nextSeed }: { level: DifficultyLevel; seed?: number }) => {
    const search = new URLSearchParams();
    if (nextSeed !== undefined) search.set('seed', String(nextSeed));
    search.set('assisted', assisted ? '1' : '0');
    setAttempt((n) => n + 1);
    void navigate({ pathname: `/games/${gameId}/play/${next}`, search: search.toString() });
  };

  return (
    <PlaySession
      key={`${gameId}:${level.value}:${rawSeed ?? ''}:${attempt}`}
      module={module}
      level={level.value}
      seed={seed?.ok ? seed.value : undefined}
      assisted={assisted}
      onRestart={restart}
    />
  );
}
