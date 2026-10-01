import type { MasteryDimension } from './exercise';
import type { ConceptId } from './ids';

export interface ConceptMastery {
  readonly conceptId: ConceptId;
  /** 0–1 per dimension; absent dimensions have no evidence yet. */
  readonly understanding: number;
  readonly application: number;
  readonly debugging: number;
  readonly attempts: number;
  readonly lastPracticedAt: number;
}

/** Weight of the newest evidence in the moving average. */
export const MASTERY_RATE = 0.4;
/** A dimension at or above this is shown as mastered. */
export const MASTERED = 0.75;

export const emptyMastery = (conceptId: ConceptId, at: number): ConceptMastery => ({
  conceptId,
  understanding: 0,
  application: 0,
  debugging: 0,
  attempts: 0,
  lastPracticedAt: at,
});

/**
 * How much an answer is worth as evidence of mastery. Getting it right after being told it was
 * wrong shows less than getting it right first time; revealing the solution shows nothing.
 */
export function effectiveCredit({
  credit,
  attempts,
  revealed,
}: {
  readonly credit: number;
  readonly attempts: number;
  readonly revealed: boolean;
}): number {
  if (revealed) return 0;
  return credit * 0.5 ** Math.max(0, attempts - 1);
}

/** m' = m + r · (evidence − m): recent evidence counts more; stays within [0, 1]. */
export function updateMastery(
  current: ConceptMastery,
  dimension: MasteryDimension,
  evidence: number,
  at: number,
): ConceptMastery {
  const clamped = Math.min(1, Math.max(0, evidence));
  const before = current[dimension];
  return {
    ...current,
    [dimension]: Math.round((before + MASTERY_RATE * (clamped - before)) * 1000) / 1000,
    attempts: current.attempts + 1,
    lastPracticedAt: at,
  };
}

/** One 0–1 figure per concept: the mean of the three dimensions. */
export const overallMastery = (mastery: ConceptMastery | undefined): number =>
  mastery === undefined ? 0 : (mastery.understanding + mastery.application + mastery.debugging) / 3;
