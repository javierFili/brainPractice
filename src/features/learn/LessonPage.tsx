import { useCourse } from '@/app/providers/useCourse';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useText } from '@/i18n';
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
import { ButtonLink } from '@/components/ui/Button';
import { NotFound } from '@/features/shared/NotFound';
import { useRecordActivity } from '@/features/shared/useProfile';
import { PageLoading } from '@/features/shared/PageLoading';
import { LessonPlayer } from './LessonPlayer';
import { LessonSummary } from './LessonSummary';
import { useLearning } from './useLearning';

export function LessonPage() {
  const { t } = useTranslation(['learn', 'lessons']);
  const tx = useText();
  const { lessonId = '' } = useParams();
  const course = useCourse();
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

  if (!lesson) return <NotFound message={t('lesson.notFound')} />;
  if (state.status === 'loading') return <PageLoading />;
  if (state.status === 'error')
    return (
      <p role="alert" className="text-rose-300">
        {t('loadError')}
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
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {t('lesson.locked', { title: tx(lesson.title) })}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-slate-400">
          {previous
            ? t('lesson.finishPrevious', { title: tx(previous.title) })
            : t('lesson.finishPreviousLesson')}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {previous && (
            <ButtonLink to={`/learn/${previous.id}`}>
              {t('lesson.goTo', { title: tx(previous.title) })}
            </ButtonLink>
          )}
          <ButtonLink to="/learn" variant="secondary">
            {t('learningPath')}
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
