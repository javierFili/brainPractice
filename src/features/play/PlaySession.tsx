import { useState } from 'react';
import type { GameResult } from '@/domain/session';
import type { DifficultyLevel } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import type { GameModule } from '@/games/types';
import { ResultsView } from '@/features/results/ResultsView';
import { SessionRunner } from './SessionRunner';
import { usePersistResult } from './usePersistResult';

export interface PlaySessionProps {
  readonly module: GameModule;
  readonly level: DifficultyLevel;
  readonly seed: number | undefined;
  readonly assisted: boolean;
  readonly onRestart: (options: { level: DifficultyLevel; seed?: number }) => void;
}

/** One session from first challenge to results. Remount (new `key`) to start another one. */
export function PlaySession({ module, level, seed, assisted, onRestart }: PlaySessionProps) {
  const { engine, progress } = useServices();
  const [session] = useState(() =>
    engine.startSession({
      gameId: module.definition.id,
      level,
      assisted,
      ...(seed === undefined ? {} : { seed }),
    }),
  );
  const [result, setResult] = useState<GameResult | null>(null);
  const saveStatus = usePersistResult(result, progress);

  if (result !== null) {
    return (
      <ResultsView
        module={module}
        result={result}
        challenges={session.getState().challenges}
        saveStatus={saveStatus}
        onRestart={onRestart}
      />
    );
  }
  return <SessionRunner module={module} session={session} onFinished={setResult} />;
}
