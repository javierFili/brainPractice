import type { ConceptId } from './ids';

/** Leitner boxes: a concept moves up a box when recalled well and back to box 1 when not. */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
export type ReviewBox = 1 | 2 | 3 | 4 | 5;

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Average credit in a review that counts as remembered. */
export const REVIEW_PASS = 0.7;

export interface ReviewItem {
  readonly conceptId: ConceptId;
  readonly box: ReviewBox;
  readonly dueAt: number;
  readonly lastReviewedAt: number | null;
}

const dueAfter = (box: ReviewBox, now: number) =>
  now + (REVIEW_INTERVAL_DAYS[box - 1] ?? 1) * DAY_MS;

/** Port, like DifficultyStrategy: Leitner today, SM-2 / FSRS later without touching callers. */
export interface ReviewScheduler {
  /** First review after a concept is learned. */
  schedule(conceptId: ConceptId, now: number): ReviewItem;
  /** Next review after a review with the given average credit. */
  reschedule(item: ReviewItem, credit: number, now: number): ReviewItem;
}

export const leitnerScheduler: ReviewScheduler = {
  schedule: (conceptId, now) => ({
    conceptId,
    box: 1,
    dueAt: dueAfter(1, now),
    lastReviewedAt: null,
  }),
  reschedule(item, credit, now) {
    const box = (credit >= REVIEW_PASS ? Math.min(5, item.box + 1) : 1) as ReviewBox;
    return { ...item, box, dueAt: dueAfter(box, now), lastReviewedAt: now };
  },
};

export const isDue = (item: ReviewItem, now: number) => item.dueAt <= now;
