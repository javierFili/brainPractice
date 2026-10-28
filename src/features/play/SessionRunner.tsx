import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import type { Answer } from '@/domain/challenge';
import { currentChallenge, lastRecord, type GameResult } from '@/domain/session';
import type { GameSession } from '@/engine';
import { useServices } from '@/app/providers/servicesContext';
import type { GameModule } from '@/games/types';
import { Button } from '@/components/ui/Button';
import { ChallengeStage } from './ChallengeStage';
import { SessionHeader } from './SessionHeader';
import { useSessionLifecycle } from './useSessionLifecycle';

interface Props {
  readonly module: GameModule;
  readonly session: GameSession;
  /** Called once when the session finishes (naturally or ended early). */
  readonly onFinished: (result: GameResult) => void;
  readonly endLabel?: string;
}

/** The game loop UI shared by regular play and the assessment. */
export function SessionRunner({ module, session, onFinished, endLabel = 'End session' }: Props) {
  const { clock } = useServices();
  const state = useSyncExternalStore(session.subscribe, session.getState);
  useSessionLifecycle(session, state, clock);
  const reported = useRef<GameSession | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const helpId = useId();

  useEffect(() => {
    if (state.status !== 'finished' || reported.current === session) return;
    const result = session.getResult();
    if (result) {
      reported.current = session;
      onFinished(result);
    }
  }, [state.status, session, onFinished]);

  const answer = useCallback(
    (value: Answer) => {
      const outcome = session.submitAnswer(value);
      if (!outcome.ok && outcome.error.code === 'INVALID_ANSWER')
        console.error('[play] Rejected answer', outcome.error);
    },
    [session],
  );

  if (state.status === 'finished') return null;
  return (
    <div>
      <SessionHeader state={state} clock={clock} title={module.definition.name} />
      <div className="mb-4 -mt-2">
        <button
          type="button"
          aria-expanded={showHelp}
          aria-controls={helpId}
          onClick={() => {
            setShowHelp((open) => !open);
          }}
          className="rounded-md text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand"
        >
          {showHelp ? 'Hide instructions' : 'How to play'}
        </button>
        {showHelp && (
          <ul
            id={helpId}
            className="mt-2 list-disc space-y-1 rounded-xl border border-line bg-surface p-4 pl-8 text-sm text-ink-soft"
          >
            {module.definition.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      <ChallengeStage
        module={module}
        challenge={currentChallenge(state)}
        status={state.status}
        record={state.status === 'feedback' ? lastRecord(state) : null}
        isLast={state.index === state.challenges.length - 1}
        assisted={state.settings.assisted}
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
          {endLabel}
        </Button>
      </div>
    </div>
  );
}
