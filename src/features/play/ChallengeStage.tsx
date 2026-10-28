import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Answer, Challenge } from '@/domain/challenge';
import type { ChallengeRecord, SessionStatus } from '@/domain/session';
import type { ChallengePhase, GameModule } from '@/games/types';
import { ChoiceResponse } from '@/components/response/ChoiceResponse';
import { NumericResponse } from '@/components/response/NumericResponse';
import { OrderingResponse } from '@/components/response/OrderingResponse';
import { SequenceResponse } from '@/components/response/SequenceResponse';
import { Button } from '@/components/ui/Button';
import { AnswerFeedback } from './AnswerFeedback';
import { BriefFeedback } from './BriefFeedback';

interface Props {
  readonly module: GameModule;
  readonly challenge: Challenge;
  readonly status: SessionStatus;
  /** Record of the current challenge once answered. */
  readonly record: ChallengeRecord | null;
  readonly isLast: boolean;
  /** Relaxed timing: views slow their own pacing and feedback waits for the player. */
  readonly assisted?: boolean;
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
  assisted = false,
  onAnswer,
  onEndStudy,
  onNext,
}: Props) {
  const { meta } = module.definition;
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
  // On touch screens a tap selects and a second step confirms: a stray tap must not answer.
  const [touch] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches,
  );
  // Tagged with its challenge, so a selection never carries over to the next one.
  const [selection, setSelection] = useState<{ challengeId: string; index: number } | null>(null);
  const pending = selection?.challengeId === challenge.id ? selection.index : null;
  const setPending = (index: number | null) => {
    setSelection(index === null ? null : { challengeId: challenge.id, index });
  };
  const selectedIndex = record?.answer?.format === 'locate' ? record.answer.index : null;
  const locate =
    response.format === 'locate'
      ? {
          disabled: !answering,
          selectedIndex,
          solutionIndex: phase === 'review' ? response.solution.index : null,
          onLocate: (index: number) => {
            if (touch) setPending(index);
            else onAnswer({ format: 'locate', index });
          },
        }
      : null;

  /** Arrow keys move between the content's buttons (lines, records, cells), Home/End jump. */
  const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key) || !(event.target instanceof HTMLButtonElement)) return;
    const buttons = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    ];
    const index = buttons.indexOf(event.target);
    if (index === -1) return;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : index + (event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1);
    const target = buttons[Math.min(buttons.length - 1, Math.max(0, next))];
    if (target) {
      event.preventDefault();
      target.focus();
    }
  };

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
            {challenge.studyPrompt ?? 'Memorise this — it will be hidden.'}
          </h2>
          <Button variant="secondary" onClick={onEndStudy} disabled={status !== 'studying'}>
            I&apos;m ready
          </Button>
        </div>
      )}

      {/* Keyboard navigation for the content's own controls; the buttons inside carry the semantics. */}
      <div
        className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6"
        onKeyDown={moveFocus}
      >
        <ContentView
          key={challenge.id}
          challenge={challenge}
          phase={phase}
          locate={locate}
          respond={answering ? onAnswer : null}
          answer={record?.answer ?? null}
          assisted={assisted}
        />
      </div>

      {touch && pending !== null && answering && (
        <div
          role="group"
          aria-label="Confirm your answer"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-sky-400/40 bg-sky-400/5 p-3 text-sm"
        >
          <span className="text-sky-100">Selected item {pending + 1}</span>
          <Button
            onClick={() => {
              onAnswer({ format: 'locate', index: pending });
              setPending(null);
            }}
          >
            Confirm
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setPending(null);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

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
          {...(module.describeOption ? { describe: module.describeOption } : {})}
          renderOption={module.renderOption}
          monospace={meta.category === 'programming'}
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

      {phase === 'respond' && response.format === 'sequence' && (
        <SequenceResponse
          key={challenge.id}
          response={response}
          disabled={!answering}
          renderOption={module.renderOption}
          onSubmit={(sequence) => {
            onAnswer({ format: 'sequence', sequence });
          }}
        />
      )}

      {phase === 'review' &&
        record !== null &&
        (meta.feedback === 'brief' ? (
          <BriefFeedback
            challenge={challenge}
            record={record}
            isLast={isLast}
            autoAdvance={!assisted}
            onNext={onNext}
          />
        ) : (
          <AnswerFeedback challenge={challenge} record={record} isLast={isLast} onNext={onNext} />
        ))}
    </section>
  );
}
