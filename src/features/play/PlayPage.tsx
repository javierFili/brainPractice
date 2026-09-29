import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { parseSeed } from '@/domain/random';
import { parseDifficultyLevel, type DifficultyLevel } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import { NotFound } from '@/features/shared/NotFound';
import { PlaySession } from './PlaySession';

export function PlayPage() {
  const { gameId = '', level: rawLevel } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { getModule } = useServices();
  const [attempt, setAttempt] = useState(0);

  const module = getModule(gameId);
  const level = parseDifficultyLevel(rawLevel);
  const rawSeed = params.get('seed');
  const seed = rawSeed === null ? null : parseSeed(rawSeed);
  if (!module || !level.ok || (seed !== null && !seed.ok)) {
    return <NotFound message="This game, level or seed does not exist." />;
  }
  const assisted = params.get('assisted') === '1';

  const restart = ({ level: next, seed: nextSeed }: { level: DifficultyLevel; seed?: number }) => {
    const search = new URLSearchParams();
    if (nextSeed !== undefined) search.set('seed', String(nextSeed));
    if (assisted) search.set('assisted', '1');
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
