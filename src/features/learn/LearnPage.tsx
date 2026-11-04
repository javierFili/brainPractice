import { useCourse } from '@/app/providers/useCourse';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import {
  courseProgress,
  dueReviews,
  lessonStatus,
  nextLesson,
  type LessonStatus,
} from '@/domain/learning';
import { useServices } from '@/app/providers/servicesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useFormat, useText } from '@/i18n';
import { PageLoading } from '@/features/shared/PageLoading';
import { relativeDay } from './dates';
import { MasteryMeter } from './MasteryMeter';
import { useLearning } from './useLearning';

/** Labels: `learn:path.status.<status>`. */
const STATUS: Readonly<Record<LessonStatus, { icon: string; tone: string }>> = {
  completed: { icon: '✓', tone: 'text-emerald-300' },
  available: { icon: '→', tone: 'text-sky-300' },
  locked: { icon: '🔒', tone: 'text-slate-500' },
};

export function LearnPage() {
  const { t } = useTranslation(['learn', 'lessons']);
  const tx = useText();
  const format = useFormat();
  const { clock } = useServices();
  const course = useCourse();
  const { state } = useLearning();
  if (state.status === 'loading') return <PageLoading />;
  if (state.status === 'error')
    return (
      <p role="alert" className="text-rose-300">
        {t('loadError')}
      </p>
    );
  const progress = state.value;
  const now = clock.now();
  const summary = courseProgress(course, progress);
  const next = nextLesson(course, progress);
  const due = dueReviews(progress, now);
  const upcoming = Object.values(progress.reviews).sort((a, b) => a.dueAt - b.dueAt)[0];

  return (
    <>
      <PageHeader
        eyebrow={t('path.eyebrow')}
        title={tx(course.title)}
        description={tx(course.summary)}
        actions={
          next ? (
            <ButtonLink to={`/learn/${next.id}`}>
              {summary.completedLessons === 0
                ? t('path.start')
                : t('path.continue', { lesson: tx(next.title) })}
            </ButtonLink>
          ) : undefined
        }
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-white">{t('path.progress')}</h2>
              <p className="font-mono text-sm text-slate-300">{format.percent(summary.ratio)}</p>
            </div>
            <div className="mt-3">
              <ProgressBar
                value={summary.completedLessons}
                max={summary.totalLessons}
                label={t('path.lessonsCompleted')}
                tone="bg-violet-400"
              />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {t('path.summary', {
                lessons: summary.completedLessons,
                totalLessons: summary.totalLessons,
                concepts: summary.masteredConcepts,
                totalConcepts: summary.totalConcepts,
              })}
            </p>
          </Card>

          {course.modules.map((module) => (
            <section
              key={module.id}
              aria-labelledby={`module-${module.id}`}
              className="flex flex-col gap-3"
            >
              <div>
                <h2 id={`module-${module.id}`} className="text-lg font-semibold text-white">
                  {tx(module.title)}
                </h2>
                <p className="text-sm text-slate-400">{tx(module.summary)}</p>
              </div>
              <ol className="flex flex-col gap-2">
                {module.lessons.map((lesson, i) => {
                  const status = lessonStatus(course, progress, lesson.id);
                  const meta = STATUS[status];
                  const record = progress.lessons[lesson.id];
                  const body = (
                    <>
                      <span aria-hidden="true" className={`w-6 text-center font-mono ${meta.tone}`}>
                        {meta.icon}
                      </span>
                      <span className="flex flex-1 flex-col">
                        <span className="font-medium text-white">
                          {i + 1}. {tx(lesson.title)}
                        </span>
                        <span className="text-sm text-slate-400">{tx(lesson.objective)}</span>
                      </span>
                      <span className="text-right font-mono text-xs text-slate-400">
                        {format.duration(lesson.minutes * 60_000)}
                        {record && (
                          <>
                            <br />
                            {t('path.best', { score: format.percent(record.bestScore) })}
                          </>
                        )}
                      </span>
                    </>
                  );
                  const className = `flex items-start gap-3 rounded-lg border px-4 py-3 ${
                    status === 'locked'
                      ? 'border-slate-800 bg-slate-950 opacity-70'
                      : 'border-slate-800 bg-slate-900/40 transition-colors hover:border-slate-600 focus-visible:outline-2 focus-visible:outline-sky-400'
                  } ${next?.id === lesson.id ? 'border-sky-400/50' : ''}`;
                  const name = record
                    ? t('path.lessonLabelBest', {
                        number: i + 1,
                        title: tx(lesson.title),
                        status: t(`path.status.${status}`),
                        score: format.percent(record.bestScore),
                      })
                    : t('path.lessonLabel', {
                        number: i + 1,
                        title: tx(lesson.title),
                        status: t(`path.status.${status}`),
                      });
                  return (
                    <li key={lesson.id}>
                      {status === 'locked' ? (
                        <div className={className} aria-label={name} role="group">
                          {body}
                        </div>
                      ) : (
                        <Link to={`/learn/${lesson.id}`} className={className} aria-label={name}>
                          {body}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>

        <aside className="flex flex-col gap-4" aria-label={t('path.aside')}>
          <Card className={due.length > 0 ? 'border-amber-400/40' : ''}>
            <h2 className="font-semibold text-white">{t('path.review')}</h2>
            {due.length > 0 ? (
              <>
                <p className="mt-1 text-sm text-slate-300">
                  {t('path.due', { count: due.length })}
                </p>
                <ButtonLink to="/learn/review" className="mt-3">
                  {t('path.reviewNow', {
                    duration: format.duration(Math.min(4, due.length) * 2 * 60_000),
                  })}
                </ButtonLink>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-400">
                {upcoming
                  ? t('path.nothingDue', {
                      when: relativeDay(upcoming.dueAt, now, format.language),
                    })
                  : t('path.noReviews')}
              </p>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold text-white">{t('path.masteryByConcept')}</h2>
            <div className="flex flex-col gap-4">
              {course.concepts
                .filter((concept) => progress.mastery[concept.id] !== undefined)
                .map((concept) => (
                  <MasteryMeter
                    key={concept.id}
                    name={concept.name}
                    mastery={progress.mastery[concept.id]}
                  />
                ))}
              {Object.keys(progress.mastery).length === 0 && (
                <p className="text-sm text-slate-400">{t('path.masteryEmpty')}</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
