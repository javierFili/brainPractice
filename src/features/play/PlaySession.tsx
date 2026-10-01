import { useCallback, useState } from 'react';
import type { GameResult } from '@/domain/session';
import type { DifficultyLevel } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import type { GameModule } from '@/games/types';
import { ResultsView } from '@/features/results/ResultsView';
import { SessionRunner } from './SessionRunner';
import { useRecordActivity } from '@/features/shared/useProfile';
import { usePersistResult } from './usePersistResult';

export interface PlaySessionProps {
  readonly module: GameModule;
  readonly level: DifficultyLevel;
  readonly seed: number | undefined;
  readonly assisted: boolean;
  readonly onRestart: (options: { level: DifficultyLevel; seed?: number }) => void;
  /** Overrides the level's challenge count (e.g. the short daily challenge). */
  readonly challengeCount?: number;
  /** Called once with the finished session (after it is handed to persistence). */
  readonly onResult?: (result: GameResult) => void;
}

/** One session from first challenge to results. Remount (new `key`) to start another one. */
export function PlaySession({
  module,
  level,
  seed,
  assisted,
  onRestart,
  challengeCount,
  onResult,
}: PlaySessionProps) {
  const { engine, progress } = useServices();
  const [session] = useState(() =>
    engine.startSession({
      gameId: module.definition.id,
      level,
      assisted,
      ...(seed === undefined ? {} : { seed }),
      ...(challengeCount === undefined ? {} : { challengeCount }),
    }),
  );
  const [result, setResult] = useState<GameResult | null>(null);
  const saveStatus = usePersistResult(result, progress);
  const recordActivity = useRecordActivity();
  const finish = useCallback(
    (finished: GameResult) => {
      setResult(finished);
      if (finished.records.some((r) => r.outcome !== 'skipped')) recordActivity();
      onResult?.(finished);
    },
    [recordActivity, onResult],
  );

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
  return <SessionRunner module={module} session={session} onFinished={finish} />;
}
