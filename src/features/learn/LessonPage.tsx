import { useCallback, useState } from 'react';
import { useParams } from 'react-router';
import {
  applyLessonResult,
  findLesson,
  lessonsOf,
  lessonStatus,
  nextLesson,
  type LearningProgress,
  type LessonResult,
  type LessonSessionState,
} from '@/domain/learning';
import type { LessonSession } from '@/engine';
import { useServices } from '@/app/providers/servicesContext';
import { ButtonLink } from '@/components/ui/Button';
import { NotFound } from '@/features/shared/NotFound';
import { useRecordActivity } from '@/features/shared/useProfile';
import { PageLoading } from '@/features/shared/PageLoading';
import { LessonPlayer } from './LessonPlayer';
import { LessonSummary } from './LessonSummary';
import { useLearning } from './useLearning';

export function LessonPage() {
  const { lessonId = '' } = useParams();
  const { course } = useServices();
  const { state, update } = useLearning();
  const recordActivity = useRecordActivity();
  const [attempt, setAttempt] = useState(0);
  const [finished, setFinished] = useState<{
    result: LessonResult;
    progress: LearningProgress | null;
    failed: boolean;
  } | null>(null);
  const lesson = findLesson(course, lessonId);

  const onFinished = useCallback(
    (_: LessonSessionState, session: LessonSession) => {
      const result = session.getResult();
      if (!result || !lesson) return;
      setFinished({ result, progress: null, failed: false });
      recordActivity();
      update((current) => applyLessonResult(current, lesson, result))
        .then((progress) => {
          setFinished({ result, progress, failed: false });
        })
        .catch((error: unknown) => {
          console.error('[learn] Could not save the lesson result', error);
          setFinished({ result, progress: null, failed: true });
        });
    },
    [lesson, update, recordActivity],
  );

  if (!lesson) return <NotFound message="This lesson does not exist." />;
  if (state.status === 'loading') return <PageLoading />;
  if (state.status === 'error')
    return (
      <p role="alert" className="text-rose-300">
        Your learning progress could not be loaded.
      </p>
    );

  if (finished) {
    const progress = finished.progress ?? state.value;
    return (
      <LessonSummary
        course={course}
        lesson={lesson}
        result={finished.result}
        progress={finished.progress}
        next={finished.result.passed ? nextLesson(course, progress) : null}
        saveFailed={finished.failed}
        onRetry={() => {
          setFinished(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  if (lessonStatus(course, state.value, lesson.id) === 'locked') {
    const lessons = lessonsOf(course);
    const previous = lessons[lessons.findIndex((l) => l.id === lesson.id) - 1];
    return (
      <div className="py-12 text-center">
        <p className="font-mono text-sm text-slate-500" aria-hidden="true">
          🔒
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{lesson.title} is not open yet</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-400">
          Each lesson builds on the one before it. Finish{' '}
          {previous ? `“${previous.title}”` : 'the previous lesson'} to open this one.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {previous && <ButtonLink to={`/learn/${previous.id}`}>Go to {previous.title}</ButtonLink>}
          <ButtonLink to="/learn" variant="secondary">
            Learning path
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <LessonPlayer
      key={`${lesson.id}:${attempt}`}
      title={lesson.title}
      lessonId={lesson.id}
      steps={lesson.steps}
      onFinished={onFinished}
    />
  );
}
