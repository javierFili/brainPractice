import type { GameResult } from '../session/gameResult';
import { COGNITIVE_AREAS, type CognitiveArea } from '../shared/cognitiveArea';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import { DomainError } from '../shared/errors';

/**
 * A fixed battery across the five areas. Each section samples one game at several levels; every
 * (section, level) pair is played as a short, regular game session.
 */
export interface AssessmentSection {
  readonly area: CognitiveArea;
  readonly gameId: string;
  readonly levels: readonly DifficultyLevel[];
  readonly challengesPerLevel: number;
}

export interface AssessmentDefinition {
  readonly id: string;
  readonly name: string;
  readonly sections: readonly AssessmentSection[];
}

export interface AssessmentStep {
  readonly index: number;
  readonly area: CognitiveArea;
  readonly gameId: string;
  readonly level: DifficultyLevel;
  readonly challengeCount: number;
}

export type CognitiveBand = 'developing' | 'solid' | 'strong' | 'exceptional';

/**
 * A 0–100 performance figure for one area, on these exercises only (no population norms). Harder
 * levels weigh more; unanswered challenges count as unsolved.
 */
export interface CognitiveScore {
  readonly value: number;
  readonly band: CognitiveBand;
  /** Challenges actually faced (answered or timed out); skipped ones are excluded. */
  readonly sampleSize: number;
  /** Challenges that make up the score, skipped ones included. */
  readonly items: number;
  /**
   * Approximate 95 % margin of the value in points (worst case for a proportion: 98 / √items).
   * Small batteries are imprecise and the UI must say so.
   */
  readonly margin: number;
}

export type CognitiveProfile = Readonly<Record<CognitiveArea, CognitiveScore | null>> & {
  /** Programming Cognitive Index: mean of the measured areas. */
  readonly overall: CognitiveScore;
};

export interface AssessmentResult {
  readonly assessmentId: string;
  readonly profile: CognitiveProfile;
  readonly steps: readonly { readonly step: AssessmentStep; readonly result: GameResult }[];
  readonly startedAt: number;
  readonly endedAt: number;
}

export class InvalidAssessmentError extends DomainError {
  constructor(message: string) {
    super('INVALID_ASSESSMENT', message);
  }
}

/** Band thresholds on the 0–100 scale. */
export const BANDS: readonly { readonly min: number; readonly band: CognitiveBand }[] = [
  { min: 80, band: 'exceptional' },
  { min: 60, band: 'strong' },
  { min: 40, band: 'solid' },
  { min: 0, band: 'developing' },
];

export const bandOf = (value: number): CognitiveBand =>
  (BANDS.find((b) => value >= b.min) as { band: CognitiveBand }).band;

export function planAssessment(definition: AssessmentDefinition): AssessmentStep[] {
  if (definition.sections.length === 0)
    throw new InvalidAssessmentError('An assessment needs at least one section');
  const steps = definition.sections.flatMap((section) => {
    if (section.levels.length === 0)
      throw new InvalidAssessmentError(`Section ${section.area} has no levels`);
    if (!Number.isInteger(section.challengesPerLevel) || section.challengesPerLevel < 1) {
      throw new InvalidAssessmentError(
        `Section ${section.area} needs a positive challengesPerLevel`,
      );
    }
    return section.levels.map((level) => ({
      area: section.area,
      gameId: section.gameId,
      level,
      challengeCount: section.challengesPerLevel,
    }));
  });
  return steps.map((step, index) => ({ ...step, index }));
}

/** Same multiplier the scoring uses: m(L) = 1 + 0.25·(L − 1). Harder evidence weighs more. */
const levelWeight = (level: DifficultyLevel) => 1 + 0.25 * (level - 1);

export const marginFor = (items: number) =>
  items === 0 ? 100 : Math.min(100, Math.round(98 / Math.sqrt(items)));

/**
 * The session performance index is computed over *attempted* challenges, which is right for
 * training but would let an assessment be inflated by skipping hard items. Scaling by
 * attempted / total is the same formula with every planned challenge in the denominator.
 */
const creditedIndex = ({ metrics, score }: GameResult) =>
  metrics.total === 0 ? 0 : (score.performanceIndex * metrics.attempted) / metrics.total;

function areaScore(
  entries: readonly { step: AssessmentStep; result: GameResult }[],
): CognitiveScore | null {
  if (entries.length === 0) return null;
  const weight = entries.reduce((sum, e) => sum + levelWeight(e.step.level), 0);
  const value = Math.round(
    entries.reduce((sum, e) => sum + levelWeight(e.step.level) * creditedIndex(e.result), 0) /
      weight,
  );
  const items = entries.reduce((sum, e) => sum + e.result.metrics.total, 0);
  return {
    value,
    band: bandOf(value),
    sampleSize: entries.reduce((sum, e) => sum + e.result.metrics.attempted, 0),
    items,
    margin: marginFor(items),
  };
}

/**
 * area value = Σ m(L)·PI'(L) / Σ m(L) over the area's steps, PI' = PI · attempted / total
 * overall    = mean of the areas in the battery (an area skipped entirely scores 0, it is not
 *              dropped: leaving out the weakest area must not raise the index)
 * Areas the battery never reached are null.
 */
export function scoreAssessment(
  definition: AssessmentDefinition,
  steps: readonly { readonly step: AssessmentStep; readonly result: GameResult }[],
  startedAt: number,
  endedAt: number,
): AssessmentResult {
  const byArea = Object.fromEntries(
    COGNITIVE_AREAS.map((area) => [area, areaScore(steps.filter((s) => s.step.area === area))]),
  ) as Record<CognitiveArea, CognitiveScore | null>;
  const measured = COGNITIVE_AREAS.map((area) => byArea[area]).filter(
    (s): s is CognitiveScore => s !== null,
  );
  const value =
    measured.length === 0
      ? 0
      : Math.round(measured.reduce((sum, s) => sum + s.value, 0) / measured.length);
  const items = measured.reduce((sum, s) => sum + s.items, 0);
  const overall: CognitiveScore = {
    value,
    band: bandOf(value),
    sampleSize: measured.reduce((sum, s) => sum + s.sampleSize, 0),
    items,
    margin: marginFor(items),
  };
  return {
    assessmentId: definition.id,
    profile: { ...byArea, overall },
    steps,
    startedAt,
    endedAt,
  };
}
