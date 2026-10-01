import { conditionsLesson, fixtureCourse, variablesLesson } from '@/test/fixtures/learningCourse';
import { mulberry32 } from '../random/mulberry32';
import { toSeed } from '../random/seed';
import { exercisesOf, type Course } from './content';
import type { Exercise } from './exercise';
import { conceptId, lessonId } from './ids';
import {
  createLessonSessionState,
  lessonReducer,
  lessonResultOf,
  MAX_ATTEMPTS,
  type LessonEvent,
  type LessonSessionState,
} from './lessonSession';
import { effectiveCredit, emptyMastery, overallMastery, updateMastery } from './mastery';
import {
  applyLessonResult,
  applyReviewResult,
  courseProgress,
  dueReviews,
  emptyLearningProgress,
  lessonStatus,
  nextLesson,
  recoverLearningProgress,
  scoreLesson,
  weakSpots,
  type ExerciseOutcome,
  type LessonResult,
} from './progress';
import { DAY_MS, leitnerScheduler } from './review';
import { planReview } from './reviewPlan';
import { validateCourse, validateExercise } from './validateCourse';

const variables = conceptId('fixture-variables');

function outcome(effective: number, overrides: Partial<ExerciseOutcome> = {}): ExerciseOutcome {
  return {
    exerciseId: 'x' as ExerciseOutcome['exerciseId'],
    concept: variables,
    dimension: 'application',
    phase: 'practice',
    attempts: 1,
    credit: effective,
    revealed: false,
    effective,
    ...overrides,
  };
}

const result = (score: number, at = 1000): LessonResult => ({
  lessonId: variablesLesson.id,
  outcomes: [outcome(score)],
  score,
  passed: score >= 0.6,
  startedAt: 0,
  endedAt: at,
});

describe('mastery', () => {
  it('moves toward the evidence, stays within 0–1 and never jumps to full mastery at once', () => {
    let m = emptyMastery(variables, 0);
    m = updateMastery(m, 'application', 1, 1);
    expect(m.application).toBe(0.4);
    m = updateMastery(m, 'application', 1, 2);
    expect(m.application).toBe(0.64);
    m = updateMastery(m, 'application', 5, 3);
    expect(m.application).toBeLessThanOrEqual(1);
    expect(m.understanding).toBe(0);
    expect(m.attempts).toBe(3);
    expect(overallMastery(m)).toBeCloseTo(m.application / 3);
  });

  it('counts later attempts for less and revealed solutions for nothing', () => {
    expect(effectiveCredit({ credit: 1, attempts: 1, revealed: false })).toBe(1);
    expect(effectiveCredit({ credit: 1, attempts: 2, revealed: false })).toBe(0.5);
    expect(effectiveCredit({ credit: 1, attempts: 3, revealed: false })).toBe(0.25);
    expect(effectiveCredit({ credit: 1, attempts: 1, revealed: true })).toBe(0);
  });
});

describe('lesson progress and unlocks', () => {
  it('weights checkpoint exercises double', () => {
    expect(
      scoreLesson([outcome(1, { phase: 'checkpoint' }), outcome(0, { phase: 'guided' })]),
    ).toBeCloseTo(0.667, 3);
    expect(scoreLesson([])).toBe(0);
  });

  it('opens lessons in order and unlocks the next one only when one is passed', () => {
    const empty = emptyLearningProgress();
    expect(lessonStatus(fixtureCourse, empty, variablesLesson.id)).toBe('available');
    expect(lessonStatus(fixtureCourse, empty, conditionsLesson.id)).toBe('locked');
    expect(lessonStatus(fixtureCourse, empty, 'unknown')).toBe('locked');

    const failed = applyLessonResult(empty, variablesLesson, result(0.4));
    expect(lessonStatus(fixtureCourse, failed, variablesLesson.id)).toBe('available');
    expect(lessonStatus(fixtureCourse, failed, conditionsLesson.id)).toBe('locked');
    expect(failed.reviews).toEqual({});

    const passed = applyLessonResult(failed, variablesLesson, result(0.9, 5000));
    expect(lessonStatus(fixtureCourse, passed, variablesLesson.id)).toBe('completed');
    expect(lessonStatus(fixtureCourse, passed, conditionsLesson.id)).toBe('available');
    expect(nextLesson(fixtureCourse, passed)?.id).toBe(conditionsLesson.id);
    expect(passed.lessons[variablesLesson.id]).toEqual({
      attempts: 2,
      bestScore: 0.9,
      completedAt: 5000,
      lastAttemptAt: 5000,
    });
  });

  it('keeps the first completion date and the best score on replays', () => {
    let progress = applyLessonResult(emptyLearningProgress(), variablesLesson, result(0.9, 10));
    progress = applyLessonResult(progress, variablesLesson, result(0.7, 20));
    expect(progress.lessons[variablesLesson.id]).toMatchObject({
      bestScore: 0.9,
      completedAt: 10,
      attempts: 2,
    });
  });

  it('reports course progress and weak spots', () => {
    const progress = applyLessonResult(emptyLearningProgress(), variablesLesson, result(0.9));
    expect(courseProgress(fixtureCourse, progress)).toEqual({
      completedLessons: 1,
      totalLessons: 2,
      masteredConcepts: 0,
      totalConcepts: 2,
      ratio: 0.5,
    });
    expect(weakSpots(fixtureCourse, progress)[0]).toMatchObject({
      concept: variables,
      dimension: 'understanding',
    });
  });
});

describe('spaced review', () => {
  it('schedules a first review a day after passing, then moves boxes with performance', () => {
    const passed = applyLessonResult(emptyLearningProgress(), variablesLesson, result(1, 0));
    expect(passed.reviews[variables]).toMatchObject({ box: 1, dueAt: DAY_MS });
    expect(dueReviews(passed, DAY_MS - 1)).toEqual([]);
    expect(dueReviews(passed, DAY_MS)).toHaveLength(1);

    const good = applyReviewResult(passed, { outcomes: [outcome(1)], endedAt: DAY_MS });
    expect(good.reviews[variables]).toMatchObject({
      box: 2,
      dueAt: DAY_MS + 3 * DAY_MS,
      lastReviewedAt: DAY_MS,
    });
    const bad = applyReviewResult(good, { outcomes: [outcome(0.2)], endedAt: 5 * DAY_MS });
    expect(bad.reviews[variables]).toMatchObject({ box: 1, dueAt: 6 * DAY_MS });
  });

  it('caps the box at 5', () => {
    let item = leitnerScheduler.schedule(variables, 0);
    for (let i = 0; i < 8; i++) item = leitnerScheduler.reschedule(item, 1, i);
    expect(item.box).toBe(5);
  });

  it('plans reviews from passed lessons only, deterministically', () => {
    const passed = applyLessonResult(emptyLearningProgress(), variablesLesson, result(1, 0));
    const plan = planReview(fixtureCourse, passed, DAY_MS, mulberry32(toSeed(7)));
    expect(plan.concepts).toEqual([variables]);
    expect(plan.steps).toHaveLength(2);
    expect(plan.steps.every((s) => s.kind === 'exercise' && s.exercise.concept === variables)).toBe(
      true,
    );
    expect(planReview(fixtureCourse, passed, DAY_MS, mulberry32(toSeed(7)))).toEqual(plan);
    expect(planReview(fixtureCourse, passed, 0, mulberry32(toSeed(7))).steps).toEqual([]);
  });
});

describe('lesson session state machine', () => {
  const run = (state: LessonSessionState, ...events: LessonEvent[]) =>
    events.reduce((s, event) => {
      const next = lessonReducer(s, event);
      if (!next.ok) throw new Error(`${event.type}: ${JSON.stringify(next.error)}`);
      return next.value;
    }, state);
  const start = () => createLessonSessionState(variablesLesson.id, variablesLesson.steps, 0);
  const next: LessonEvent = { type: 'continue', at: 1 };

  it('walks explanation → playground → exercises, and only leaves an exercise after answering', () => {
    let state = run(start(), next, next);
    expect(state.exercise).toMatchObject({ status: 'answering', attempts: 0 });
    expect(lessonReducer(state, next)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_TRANSITION' },
    });
    state = run(state, { type: 'submit', answer: { kind: 'multiple-choice', optionId: 'a' } });
    expect(state.exercise).toMatchObject({ status: 'feedback', final: true });
    // Double submit is rejected.
    expect(
      lessonReducer(state, { type: 'submit', answer: { kind: 'multiple-choice', optionId: 'a' } })
        .ok,
    ).toBe(false);
  });

  it('allows retries with a hint for guided exercises, and records a weaker outcome', () => {
    let state = run(start(), next, next, {
      type: 'submit',
      answer: { kind: 'multiple-choice', optionId: 'b' },
    });
    expect(state.exercise).toMatchObject({ status: 'feedback', final: false });
    state = run(state, { type: 'retry' });
    expect(state.exercise).toMatchObject({ status: 'answering', hintsShown: 1, attempts: 1 });
    state = run(
      state,
      { type: 'submit', answer: { kind: 'multiple-choice', optionId: 'a' } },
      next,
    );
    expect(state.outcomes[0]).toMatchObject({
      attempts: 2,
      credit: 1,
      effective: 0.5,
      revealed: false,
    });
  });

  it('stops retrying at the attempt limit and lets the learner reveal the solution', () => {
    let state = run(start(), next, next);
    for (let i = 0; i < MAX_ATTEMPTS.guided; i++) {
      state = run(state, { type: 'submit', answer: { kind: 'multiple-choice', optionId: 'c' } });
      if (i < MAX_ATTEMPTS.guided - 1) state = run(state, { type: 'retry' });
    }
    expect(state.exercise).toMatchObject({ final: true });
    expect(lessonReducer(state, { type: 'retry' }).ok).toBe(false);
    state = run(state, { type: 'reveal' }, next);
    expect(state.outcomes[0]).toMatchObject({ revealed: true, effective: 0 });
  });

  it('penalises asking for hints a little, and never allows hints in checkpoints', () => {
    let state = run(start(), next, next, { type: 'hint' });
    expect(lessonReducer(state, { type: 'hint' })).toMatchObject({
      ok: false,
      error: { code: 'NO_MORE_HINTS' },
    });
    state = run(
      state,
      { type: 'submit', answer: { kind: 'multiple-choice', optionId: 'a' } },
      next,
    );
    expect(state.outcomes[0]?.effective).toBe(0.8);

    const checkpoint = createLessonSessionState(
      variablesLesson.id,
      variablesLesson.steps.slice(6),
      0,
    );
    expect(lessonReducer(checkpoint, { type: 'hint' }).ok).toBe(false);
    const answered = run(checkpoint, {
      type: 'submit',
      answer: { kind: 'debugging', line: 1, causeId: 'order' },
    });
    expect(answered.exercise).toMatchObject({ final: true });
  });

  it('finishes with a scored, passed result after a perfect run', () => {
    const answers: LessonEvent[] = [
      { type: 'submit', answer: { kind: 'multiple-choice', optionId: 'a' } },
      { type: 'submit', answer: { kind: 'prediction', value: '30' } },
      { type: 'submit', answer: { kind: 'code-completion', blanks: { op: '+' } } },
      { type: 'submit', answer: { kind: 'ordering', order: ['set', 'double', 'show'] } },
      { type: 'submit', answer: { kind: 'debugging', line: 2, causeId: 'overwrite' } },
      {
        type: 'submit',
        answer: { kind: 'matching', pairs: { n: 'number', s: 'text', b: 'bool' } },
      },
    ];
    const state = run(
      start(),
      next,
      next,
      ...answers.flatMap((a) => [a, { type: 'continue' as const, at: 99 }]),
    );
    expect(state.endedAt).toBe(99);
    expect(lessonResultOf(state)).toMatchObject({ score: 1, passed: true, endedAt: 99 });
    expect(lessonReducer(state, next)).toMatchObject({ ok: false, error: { code: 'FINISHED' } });
  });

  it('rejects malformed answers without consuming an attempt', () => {
    const state = run(start(), next, next);
    const rejected = lessonReducer(state, {
      type: 'submit',
      answer: { kind: 'prediction', value: 'x' },
    });
    expect(rejected).toMatchObject({ ok: false, error: { code: 'INVALID_ANSWER' } });
  });
});

describe('content validation', () => {
  it('accepts the fixture course', () => {
    expect(validateCourse(fixtureCourse)).toEqual([]);
  });

  it('catches wrong expected answers by running the code', () => {
    const exercise = exercisesOf(variablesLesson)[1] as Exercise;
    expect(validateExercise({ ...exercise, expected: '31' } as Exercise)).toEqual([
      'expected 31 but the program gives 30',
    ]);
  });

  it('catches ambiguous completions, sloppy fixes and missing misconceptions', () => {
    const [mc, , completion, , debug] = exercisesOf(variablesLesson) as Exercise[];
    if (
      completion?.kind !== 'code-completion' ||
      debug?.kind !== 'debugging' ||
      mc?.kind !== 'multiple-choice'
    )
      throw new Error('fixture changed');
    expect(
      validateExercise({
        ...completion,
        // 2 + 2 and 2 * 2 are both 4: the validator must notice that either choice works.
        template: 'a = 2\nb = 2\ntotal = a [[op]] b',
        blanks: [{ id: 'op', options: ['+', '*'], correct: '+' }],
        check: { variable: 'total', expected: '4' },
      }),
    ).toEqual(['blank op: "*" also works, so the answer is ambiguous']);
    expect(
      validateExercise({
        ...debug,
        fix: { ...debug.fix, source: 'total = 4\ntotal = total + 4\nprint(total)' },
      }),
    ).toContain('the fix must change only the bug line');
    expect(validateExercise({ ...mc, misconceptions: {} })).toEqual([
      'option b has no misconception',
      'option c has no misconception',
    ]);
  });

  it('enforces the pedagogical arc of a lesson', () => {
    const course: Course = {
      ...fixtureCourse,
      modules: [
        {
          ...(fixtureCourse.modules[0] as Course['modules'][number]),
          lessons: [{ ...variablesLesson, steps: variablesLesson.steps.slice(2, 5) }],
        },
      ],
    };
    expect(validateCourse(course)).toEqual(
      expect.arrayContaining([
        'fixture-variables: must open with an explanation',
        'fixture-variables: needs an interactive playground',
        'fixture-variables: needs at least 5 exercises, has 3',
        'fixture-variables: needs a checkpoint',
        'fixture-variables: no exercise trains debugging',
        'concept fixture-conditions is never taught',
      ]),
    );
  });
});

describe('learning progress persistence', () => {
  it('round-trips valid progress and recovers what it can from damaged data', () => {
    const progress = applyLessonResult(emptyLearningProgress(), variablesLesson, result(0.9));
    expect(recoverLearningProgress(JSON.parse(JSON.stringify(progress)))).toEqual({
      value: progress,
      discarded: 0,
    });
    const damaged = {
      ...progress,
      lessons: { ...progress.lessons, other: { attempts: 'x' } },
      mastery: {
        ...progress.mastery,
        wrong: { ...progress.mastery[variables], conceptId: 'mismatch' },
      },
    };
    expect(recoverLearningProgress(damaged)).toEqual({ value: progress, discarded: 2 });
    expect(recoverLearningProgress({ schemaVersion: 9 })).toBeNull();
    expect(lessonId('a-b')).toBe('a-b');
    expect(() => lessonId('Not Kebab')).toThrow();
  });
});
