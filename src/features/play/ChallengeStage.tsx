import { useEffect, useRef } from 'react';
import type { Answer, Challenge } from '@/domain/challenge';
import type { ChallengeRecord, SessionStatus } from '@/domain/session';
import type { ChallengePhase, GameModule } from '@/games/types';
import { ChoiceResponse } from '@/components/response/ChoiceResponse';
import { NumericResponse } from '@/components/response/NumericResponse';
import { OrderingResponse } from '@/components/response/OrderingResponse';
import { Button } from '@/components/ui/Button';
import { AnswerFeedback } from './AnswerFeedback';

interface Props {
  readonly module: GameModule;
  readonly challenge: Challenge;
  readonly status: SessionStatus;
  /** Record of the current challenge once answered. */
  readonly record: ChallengeRecord | null;
  readonly isLast: boolean;
  readonly onAnswer: (answer: Answer) => void;
  readonly onEndStudy: () => void;
  readonly onNext: () => void;
}

/**
 * `presenting` lasts one frame before the session starts measuring. For memory challenges it must
 * already look like the study phase, or the question and options would flash before memorising.
 */
const phaseOf = (status: SessionStatus, challenge: Challenge): ChallengePhase =>
  status === 'studying' || (status === 'presenting' && challenge.timing.studyMs !== null)
    ? 'study'
    : status === 'feedback' || status === 'finished'
      ? 'review'
      : 'respond';

export function ChallengeStage({
  module,
  challenge,
  status,
  record,
  isLast,
  onAnswer,
  onEndStudy,
  onNext,
}: Props) {
  const phase = phaseOf(status, challenge);
  const { ContentView } = module;
  const answering = status === 'responding';
  const headingRef = useRef<HTMLHeadingElement>(null);
  const showPrompt = phase !== 'study';

  // Move focus to the question whenever a new one appears or the study phase ends.
  useEffect(() => {
    if (showPrompt) headingRef.current?.focus();
  }, [challenge.id, showPrompt]);

  const { response } = challenge;
  const selectedIndex = record?.answer?.format === 'locate' ? record.answer.index : null;
  const locate =
    response.format === 'locate'
      ? {
          disabled: !answering,
          selectedIndex,
          solutionIndex: phase === 'review' ? response.solution.index : null,
          onLocate: (index: number) => {
            onAnswer({ format: 'locate', index });
          },
        }
      : null;

  return (
    <section aria-labelledby="challenge-prompt" className="flex flex-col gap-6">
      {showPrompt ? (
        <h2
          id="challenge-prompt"
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-medium text-white outline-none sm:text-xl"
        >
          {challenge.prompt}
        </h2>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="challenge-prompt" className="text-lg font-medium text-white sm:text-xl">
            Memorise this — it will be hidden.
          </h2>
          <Button variant="secondary" onClick={onEndStudy} disabled={status !== 'studying'}>
            I&apos;m ready
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
        <ContentView challenge={challenge} phase={phase} locate={locate} />
      </div>

      {phase !== 'study' && response.format === 'single-choice' && (
        <ChoiceResponse
          response={response}
          disabled={!answering}
          review={
            phase === 'review'
              ? {
                  selectedId:
                    record?.answer?.format === 'single-choice' ? record.answer.optionId : null,
                }
              : null
          }
          onSelect={(optionId) => {
            onAnswer({ format: 'single-choice', optionId });
          }}
          monospace
        />
      )}
      {phase === 'respond' && response.format === 'numeric' && (
        <NumericResponse
          key={challenge.id}
          response={response}
          disabled={!answering}
          onSubmit={(value) => {
            onAnswer({ format: 'numeric', value });
          }}
        />
      )}
      {phase === 'respond' && response.format === 'ordering' && (
        <OrderingResponse
          key={challenge.id}
          response={response}
          disabled={!answering}
          onSubmit={(order) => {
            onAnswer({ format: 'ordering', order });
          }}
        />
      )}

      {phase === 'review' && record !== null && (
        <AnswerFeedback challenge={challenge} record={record} isLast={isLast} onNext={onNext} />
      )}
    </section>
  );
}
