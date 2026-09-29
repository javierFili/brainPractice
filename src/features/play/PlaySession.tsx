import { useCallback, useState, useSyncExternalStore } from 'react';
import type { Answer } from '@/domain/challenge';
import { currentChallenge, lastRecord } from '@/domain/session';
import type { DifficultyLevel } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import type { GameModule } from '@/games/types';
import { Button } from '@/components/ui/Button';
import { ResultsView } from '@/features/results/ResultsView';
import { ChallengeStage } from './ChallengeStage';
import { SessionHeader } from './SessionHeader';
import { usePersistResult } from './usePersistResult';
import { useSessionLifecycle } from './useSessionLifecycle';

export interface PlaySessionProps {
  readonly module: GameModule;
  readonly level: DifficultyLevel;
  readonly seed: number | undefined;
  readonly assisted: boolean;
  readonly onRestart: (options: { level: DifficultyLevel; seed?: number }) => void;
}

/** One session from first challenge to results. Remount (new `key`) to start another one. */
export function PlaySession({ module, level, seed, assisted, onRestart }: PlaySessionProps) {
  const { engine, clock, progress } = useServices();
  const [session] = useState(() =>
    engine.startSession({
      gameId: module.definition.id,
      level,
      assisted,
      ...(seed === undefined ? {} : { seed }),
    }),
  );
  const state = useSyncExternalStore(session.subscribe, session.getState);
  useSessionLifecycle(session, state, clock);
  const result = state.status === 'finished' ? session.getResult() : null;
  const saveStatus = usePersistResult(result, progress);

  const answer = useCallback(
    (value: Answer) => {
      const outcome = session.submitAnswer(value);
      if (!outcome.ok && outcome.error.code === 'INVALID_ANSWER')
        console.error('[play] Rejected answer', outcome.error);
    },
    [session],
  );

  if (result !== null) {
    return (
      <ResultsView
        module={module}
        result={result}
        challenges={state.challenges}
        saveStatus={saveStatus}
        onRestart={onRestart}
      />
    );
  }

  const challenge = currentChallenge(state);
  const record = state.status === 'feedback' ? lastRecord(state) : null;
  return (
    <div>
      <SessionHeader state={state} clock={clock} title={module.definition.name} />
      <ChallengeStage
        module={module}
        challenge={challenge}
        status={state.status}
        record={record}
        isLast={state.index === state.challenges.length - 1}
        onAnswer={answer}
        onEndStudy={() => {
          session.endStudy();
        }}
        onNext={() => {
          session.advance();
        }}
      />
      <div className="mt-10 flex justify-end border-t border-slate-800 pt-4">
        <Button
          variant="ghost"
          onClick={() => {
            session.finish();
          }}
        >
          End session
        </Button>
      </div>
    </div>
  );
}
