import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssessmentDefinition, AssessmentResult } from '@/domain/assessment';
import { applyAssessmentResult, emptyProgress } from '@/domain/progress';
import type { GameResult } from '@/domain/session';
import { startAssessment } from '@/engine';
import { useServices } from '@/app/providers/servicesContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AREAS } from '@/features/shared/areas';
import { SessionRunner } from '@/features/play/SessionRunner';
import { AssessmentResultView } from './AssessmentResultView';

export function AssessmentFlow({
  definition,
  onRestart,
}: {
  definition: AssessmentDefinition;
  onRestart: () => void;
}) {
  const { engine, clock, getModule, progress } = useServices();
  const [run] = useState(() => startAssessment(definition, engine, clock));
  const [session, setSession] = useState(() => run.startStep());
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const saved = useRef(false);

  const onStepFinished = useCallback(
    (stepResult: GameResult) => {
      run.completeStep(stepResult);
      const final = run.result();
      if (final) setResult(final);
      else setSession(run.startStep());
    },
    [run],
  );

  useEffect(() => {
    if (!result || saved.current) return;
    saved.current = true;
    progress
      .get()
      .then((current) => progress.save(applyAssessmentResult(current ?? emptyProgress(), result)))
      .catch((error: unknown) => {
        console.error('[assessment] Could not save the result', error);
      });
  }, [result, progress]);

  if (result) return <AssessmentResultView result={result} onRestart={onRestart} />;

  const step = run.currentStep();
  const module = step ? getModule(step.gameId) : undefined;
  if (!step || !module)
    return (
      <p role="alert" className="text-rose-300">
        This assessment step is not available.
      </p>
    );
  const meta = AREAS[step.area];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className={`font-semibold ${meta.accent}`}>
            <span aria-hidden="true">{meta.glyph} </span>
            {meta.label} · level {step.level}
          </span>
          <span className="font-mono text-slate-400">
            Round {step.index + 1} of {run.steps.length}
          </span>
        </p>
        <ProgressBar
          value={step.index}
          max={run.steps.length}
          label="Assessment progress"
          tone="bg-violet-400"
        />
      </div>
      <SessionRunner
        key={step.index}
        module={module}
        session={session}
        onFinished={onStepFinished}
        endLabel="Skip rest of round"
      />
    </div>
  );
}
