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

/** A 0–100 performance figure for one area. Relative to item difficulty, not to population norms. */
export interface CognitiveScore {
  readonly value: number;
  readonly band: CognitiveBand;
  /** Challenges actually attempted; small samples mean low confidence. */
  readonly sampleSize: number;
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

function areaScore(
  entries: readonly { step: AssessmentStep; result: GameResult }[],
): CognitiveScore | null {
  const measured = entries.filter((e) => e.result.metrics.attempted > 0);
  if (measured.length === 0) return null;
  const weight = measured.reduce((sum, e) => sum + levelWeight(e.step.level), 0);
  const value = Math.round(
    measured.reduce(
      (sum, e) => sum + levelWeight(e.step.level) * e.result.score.performanceIndex,
      0,
    ) / weight,
  );
  return {
    value,
    band: bandOf(value),
    sampleSize: measured.reduce((sum, e) => sum + e.result.metrics.attempted, 0),
  };
}

/**
 * area value = Σ m(L)·PI(L) / Σ m(L) over the area's steps with at least one attempt
 * overall      = mean of measured areas (areas without evidence are reported as null, not 0)
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
  const overall: CognitiveScore = {
    value,
    band: bandOf(value),
    sampleSize: measured.reduce((sum, s) => sum + s.sampleSize, 0),
  };
  return {
    assessmentId: definition.id,
    profile: { ...byArea, overall },
    steps,
    startedAt,
    endedAt,
  };
}
