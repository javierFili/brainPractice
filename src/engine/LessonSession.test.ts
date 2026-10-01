import { variablesLesson } from '@/test/fixtures/learningCourse';
import { FakeClock } from '@/test/fakes/FakeClock';
import { createLessonSession } from './LessonSession';

describe('LessonSession', () => {
  it('stamps time from the clock, notifies subscribers and exposes the result at the end', () => {
    const clock = new FakeClock(100);
    const session = createLessonSession(
      variablesLesson.id,
      variablesLesson.steps.slice(0, 3),
      clock,
    );
    const listener = vi.fn();
    const unsubscribe = session.subscribe(listener);

    expect(session.next().ok).toBe(true);
    expect(session.next().ok).toBe(true);
    expect(session.submit({ kind: 'multiple-choice', optionId: 'a' }).ok).toBe(true);
    expect(session.getResult()).toBeNull();
    clock.advance(5000);
    expect(session.next().ok).toBe(true);
    expect(listener).toHaveBeenCalledTimes(4);
    expect(session.getResult()).toMatchObject({
      startedAt: 100,
      endedAt: 5100,
      score: 1,
      passed: true,
    });

    unsubscribe();
    expect(session.next()).toMatchObject({ ok: false, error: { code: 'FINISHED' } });
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('reports invalid commands as errors without notifying', () => {
    const session = createLessonSession(variablesLesson.id, variablesLesson.steps, new FakeClock());
    const listener = vi.fn();
    session.subscribe(listener);
    expect(session.retry().ok).toBe(false);
    expect(session.reveal().ok).toBe(false);
    expect(session.hint().ok).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
