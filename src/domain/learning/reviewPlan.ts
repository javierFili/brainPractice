import type { RandomGenerator } from '../random/RandomGenerator';
import { shuffle } from '../random/sampling';
import { exercisesOf, lessonsOf, type Course, type LessonStep } from './content';
import type { ConceptId } from './ids';
import type { LearningProgress } from './progress';
import { dueReviews } from './progress';

export const MAX_REVIEW_CONCEPTS = 4;
export const EXERCISES_PER_CONCEPT = 2;

/**
 * Steps of a short review: for each due concept (most overdue first), exercises from the lessons
 * already passed, weakest dimension first. Deterministic for a given random stream.
 */
export function planReview(
  course: Course,
  progress: LearningProgress,
  now: number,
  random: RandomGenerator,
): { readonly concepts: readonly ConceptId[]; readonly steps: readonly LessonStep[] } {
  const concepts = dueReviews(progress, now)
    .slice(0, MAX_REVIEW_CONCEPTS)
    .map((item) => item.conceptId);
  const passed = lessonsOf(course).filter(
    (l) => (progress.lessons[l.id]?.completedAt ?? null) !== null,
  );
  const steps = concepts.flatMap((concept) => {
    const mastery = progress.mastery[concept];
    const pool = shuffle(
      random,
      passed.flatMap((lesson) => exercisesOf(lesson)).filter((e) => e.concept === concept),
    ).sort((a, b) => (mastery ? mastery[a.dimension] - mastery[b.dimension] : 0));
    return pool.slice(0, EXERCISES_PER_CONCEPT).map((exercise): LessonStep => ({
      kind: 'exercise',
      id: `review-${exercise.id}`,
      phase: 'practice',
      exercise,
    }));
  });
  return { concepts, steps };
}
