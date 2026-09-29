import {
  planAssessment,
  scoreAssessment,
  type AssessmentDefinition,
  type AssessmentResult,
  type AssessmentStep,
} from '@/domain/assessment';
import type { GameResult } from '@/domain/session';
import type { Clock } from '@/domain/time/Clock';
import type { GameEngine } from './GameEngine';
import type { GameSession } from './GameSession';

export interface AssessmentRun {
  readonly steps: readonly AssessmentStep[];
  /** Null once every step is done. */
  readonly currentStep: () => AssessmentStep | null;
  /** Starts the current step as a regular game session. */
  readonly startStep: () => GameSession;
  /** Records the finished session of the current step and moves on. */
  readonly completeStep: (result: GameResult) => void;
  /** Available once every step is complete. */
  readonly result: () => AssessmentResult | null;
}

/** Orchestrates an assessment by reusing the GameEngine: no second game loop exists. */
export function startAssessment(
  definition: AssessmentDefinition,
  engine: GameEngine,
  clock: Clock,
): AssessmentRun {
  const steps = planAssessment(definition);
  const startedAt = clock.now();
  const completed: { step: AssessmentStep; result: GameResult }[] = [];
  let final: AssessmentResult | null = null;

  const currentStep = () => steps[completed.length] ?? null;

  return {
    steps,
    currentStep,
    startStep() {
      const step = currentStep();
      if (!step) throw new Error('The assessment is already complete');
      return engine.startSession({
        gameId: step.gameId,
        level: step.level,
        challengeCount: step.challengeCount,
      });
    },
    completeStep(result) {
      const step = currentStep();
      if (!step) throw new Error('The assessment is already complete');
      if (result.gameId !== step.gameId || result.level !== step.level) {
        throw new Error(
          `Result for ${result.gameId} L${result.level} does not match step ${step.gameId} L${step.level}`,
        );
      }
      completed.push({ step, result });
      if (currentStep() === null)
        final = scoreAssessment(definition, completed, startedAt, clock.now());
    },
    result: () => final,
  };
}
