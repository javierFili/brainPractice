import {
  isJsonObject,
  keepValidEntries,
  migrate,
  type Migration,
  type Recovered,
} from '../storage/migrations';
import type { Repository } from '../storage/repository';
import { exercisesOf, lessonsOf, type Course, type ExercisePhase, type Lesson } from './content';
import { MASTERY_DIMENSIONS, type MasteryDimension } from './exercise';
import type { ConceptId, ExerciseId, LessonId } from './ids';
import {
  emptyMastery,
  MASTERED,
  overallMastery,
  updateMastery,
  type ConceptMastery,
} from './mastery';
import { isDue, leitnerScheduler, type ReviewItem, type ReviewScheduler } from './review';

export const LEARNING_SCHEMA_VERSION = 1;
/** A lesson is passed at this score (0–1). */
export const LESSON_PASS = 0.6;
const PHASE_WEIGHT: Readonly<Record<ExercisePhase, number>> = {
  guided: 1,
  practice: 1,
  checkpoint: 2,
};

/** How one exercise went inside a lesson or a review. */
export interface ExerciseOutcome {
  readonly exerciseId: ExerciseId;
  readonly concept: ConceptId;
  readonly dimension: MasteryDimension;
  readonly phase: ExercisePhase;
  readonly attempts: number;
  /** Credit of the last attempt (0–1). */
  readonly credit: number;
  readonly revealed: boolean;
  /** Credit as evidence of mastery (see `effectiveCredit`). */
  readonly effective: number;
}

export interface LessonResult {
  readonly lessonId: LessonId;
  readonly outcomes: readonly ExerciseOutcome[];
  /** 0–1 weighted mean of the effective credit; checkpoint exercises count double. */
  readonly score: number;
  readonly passed: boolean;
  readonly startedAt: number;
  readonly endedAt: number;
}

export interface LessonRecord {
  readonly attempts: number;
  readonly bestScore: number;
  /** First time the lesson was passed; null until then. */
  readonly completedAt: number | null;
  readonly lastAttemptAt: number;
}

export interface LearningProgress {
  readonly schemaVersion: typeof LEARNING_SCHEMA_VERSION;
  readonly lessons: Readonly<Record<string, LessonRecord>>;
  readonly mastery: Readonly<Record<string, ConceptMastery>>;
  readonly reviews: Readonly<Record<string, ReviewItem>>;
}

export type LearningProgressRepository = Repository<LearningProgress>;

export const emptyLearningProgress = (): LearningProgress => ({
  schemaVersion: LEARNING_SCHEMA_VERSION,
  lessons: {},
  mastery: {},
  reviews: {},
});

export function scoreLesson(outcomes: readonly ExerciseOutcome[]): number {
  const weight = outcomes.reduce((sum, o) => sum + PHASE_WEIGHT[o.phase], 0);
  if (weight === 0) return 0;
  const total = outcomes.reduce((sum, o) => sum + PHASE_WEIGHT[o.phase] * o.effective, 0);
  return Math.round((total / weight) * 1000) / 1000;
}

function applyOutcomes(
  mastery: Readonly<Record<string, ConceptMastery>>,
  outcomes: readonly ExerciseOutcome[],
  at: number,
): Record<string, ConceptMastery> {
  const next: Record<string, ConceptMastery> = { ...mastery };
  for (const outcome of outcomes) {
    const current = next[outcome.concept] ?? emptyMastery(outcome.concept, at);
    next[outcome.concept] = updateMastery(current, outcome.dimension, outcome.effective, at);
  }
  return next;
}

/** Pure update after a lesson attempt: record, mastery, and first reviews once it is passed. */
export function applyLessonResult(
  progress: LearningProgress,
  lesson: Lesson,
  result: LessonResult,
  scheduler: ReviewScheduler = leitnerScheduler,
): LearningProgress {
  const previous = progress.lessons[result.lessonId];
  const record: LessonRecord = {
    attempts: (previous?.attempts ?? 0) + 1,
    bestScore: Math.max(previous?.bestScore ?? 0, result.score),
    completedAt: previous?.completedAt ?? (result.passed ? result.endedAt : null),
    lastAttemptAt: result.endedAt,
  };
  const reviews: Record<string, ReviewItem> = { ...progress.reviews };
  if (result.passed)
    for (const concept of lesson.concepts)
      reviews[concept] ??= scheduler.schedule(concept, result.endedAt);
  return {
    ...progress,
    lessons: { ...progress.lessons, [result.lessonId]: record },
    mastery: applyOutcomes(progress.mastery, result.outcomes, result.endedAt),
    reviews,
  };
}

export interface ReviewResult {
  readonly outcomes: readonly ExerciseOutcome[];
  readonly endedAt: number;
}

/** Pure update after a review session: mastery, then each reviewed concept moves box. */
export function applyReviewResult(
  progress: LearningProgress,
  result: ReviewResult,
  scheduler: ReviewScheduler = leitnerScheduler,
): LearningProgress {
  const reviews: Record<string, ReviewItem> = { ...progress.reviews };
  const concepts = [...new Set(result.outcomes.map((o) => o.concept))];
  for (const concept of concepts) {
    const outcomes = result.outcomes.filter((o) => o.concept === concept);
    const credit = outcomes.reduce((sum, o) => sum + o.effective, 0) / outcomes.length;
    const item = reviews[concept] ?? scheduler.schedule(concept, result.endedAt);
    reviews[concept] = scheduler.reschedule(item, credit, result.endedAt);
  }
  return {
    ...progress,
    mastery: applyOutcomes(progress.mastery, result.outcomes, result.endedAt),
    reviews,
  };
}

// ── Queries ─────────────────────────────────────────────────────────────────────────────────────

export type LessonStatus = 'locked' | 'available' | 'completed';

export const isLessonCompleted = (progress: LearningProgress, id: string) =>
  (progress.lessons[id]?.completedAt ?? null) !== null;

/**
 * Lessons open in order: the first one, any lesson already attempted, and the lesson after a
 * completed one. The order is pedagogical (each lesson builds on the previous), not a paywall.
 */
export function lessonStatus(course: Course, progress: LearningProgress, id: string): LessonStatus {
  const lessons = lessonsOf(course);
  const index = lessons.findIndex((lesson) => lesson.id === id);
  if (index === -1) return 'locked';
  if (isLessonCompleted(progress, id)) return 'completed';
  const previous = lessons[index - 1];
  if (index === 0 || progress.lessons[id] !== undefined) return 'available';
  return previous && isLessonCompleted(progress, previous.id) ? 'available' : 'locked';
}

/** The lesson to continue with: the first one not yet completed that is open. */
export function nextLesson(course: Course, progress: LearningProgress): Lesson | null {
  return (
    lessonsOf(course).find((lesson) => lessonStatus(course, progress, lesson.id) === 'available') ??
    null
  );
}

export interface CourseProgress {
  readonly completedLessons: number;
  readonly totalLessons: number;
  readonly masteredConcepts: number;
  readonly totalConcepts: number;
  /** 0–1: share of completed lessons. */
  readonly ratio: number;
}

export function courseProgress(course: Course, progress: LearningProgress): CourseProgress {
  const lessons = lessonsOf(course);
  const completedLessons = lessons.filter((l) => isLessonCompleted(progress, l.id)).length;
  const masteredConcepts = course.concepts.filter(
    (c) => overallMastery(progress.mastery[c.id]) >= MASTERED,
  ).length;
  return {
    completedLessons,
    totalLessons: lessons.length,
    masteredConcepts,
    totalConcepts: course.concepts.length,
    ratio: lessons.length === 0 ? 0 : completedLessons / lessons.length,
  };
}

export const dueReviews = (progress: LearningProgress, now: number): ReviewItem[] =>
  Object.values(progress.reviews)
    .filter((item) => isDue(item, now))
    .sort((a, b) => a.dueAt - b.dueAt);

/** Dimensions of a lesson's concepts that are still weak, weakest first (drives recommendations). */
export function weakSpots(
  course: Course,
  progress: LearningProgress,
): { readonly concept: ConceptId; readonly dimension: MasteryDimension; readonly value: number }[] {
  return course.concepts
    .flatMap((concept) => {
      const mastery = progress.mastery[concept.id];
      if (!mastery) return [];
      return MASTERY_DIMENSIONS.filter((d) =>
        lessonsOf(course).some((l) =>
          exercisesOf(l).some((e) => e.concept === concept.id && e.dimension === d),
        ),
      ).map((dimension) => ({ concept: concept.id, dimension, value: mastery[dimension] }));
    })
    .filter((spot) => spot.value < MASTERED)
    .sort((a, b) => a.value - b.value);
}

// ── Persistence guards ──────────────────────────────────────────────────────────────────────────

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const unit = (value: unknown): value is number => finite(value) && value >= 0 && value <= 1;

const isLessonRecord = (_: string, value: unknown): value is LessonRecord =>
  isJsonObject(value) &&
  finite(value['attempts']) &&
  unit(value['bestScore']) &&
  (value['completedAt'] === null || finite(value['completedAt'])) &&
  finite(value['lastAttemptAt']);

const isMastery = (key: string, value: unknown): value is ConceptMastery =>
  isJsonObject(value) &&
  value['conceptId'] === key &&
  MASTERY_DIMENSIONS.every((d) => unit(value[d])) &&
  finite(value['attempts']) &&
  finite(value['lastPracticedAt']);

const isReview = (key: string, value: unknown): value is ReviewItem =>
  isJsonObject(value) &&
  value['conceptId'] === key &&
  [1, 2, 3, 4, 5].includes(value['box'] as number) &&
  finite(value['dueAt']) &&
  (value['lastReviewedAt'] === null || finite(value['lastReviewedAt']));

export const LEARNING_MIGRATIONS: Readonly<Partial<Record<number, Migration>>> = {};

/** Validates untrusted persisted data, keeping every valid entry (see recoverUserProgress). */
export function recoverLearningProgress(value: unknown): Recovered<LearningProgress> | null {
  const migrated = migrate(value, LEARNING_SCHEMA_VERSION, LEARNING_MIGRATIONS);
  if (!migrated.ok) return null;
  const document = migrated.value;
  const tally = { discarded: 0 };
  return {
    value: {
      schemaVersion: LEARNING_SCHEMA_VERSION,
      lessons: keepValidEntries(document['lessons'], isLessonRecord, tally),
      mastery: keepValidEntries(document['mastery'], isMastery, tally),
      reviews: keepValidEntries(document['reviews'], isReview, tally),
    },
    discarded: tally.discarded,
  };
}
