import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { joinText, textId } from '@/domain/shared';
import { useFormat, useText } from '@/i18n';
import {
  conceptOf,
  type Course,
  type LearningProgress,
  type Lesson,
  type LessonResult,
} from '@/domain/learning';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatTile } from '@/components/ui/StatTile';
import { MasteryMeter } from './MasteryMeter';
import { InlineText } from './RichBlocks';
import { TrainingLinks } from './TrainingLinks';

export function LessonSummary({
  course,
  lesson,
  result,
  progress,
  next,
  saveFailed,
  onRetry,
}: {
  course: Course;
  lesson: Lesson;
  result: LessonResult;
  progress: LearningProgress | null;
  next: Lesson | null;
  saveFailed: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation(['learn', 'lessons']);
  const tx = useText();
  const format = useFormat();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const checkpoint = result.outcomes.filter((o) => o.phase === 'checkpoint');
  const checkpointScore =
    checkpoint.length === 0
      ? null
      : checkpoint.reduce((sum, o) => sum + o.effective, 0) / checkpoint.length;
  const firstTry = result.outcomes.filter(
    (o) => o.attempts === 1 && o.credit === 1 && !o.revealed,
  ).length;
  const concepts = lesson.concepts.flatMap((id) => conceptOf(course, id) ?? []);

  return (
    <article aria-labelledby="summary-title" className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          {tx(lesson.title)}
        </p>
        <h1
          id="summary-title"
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold text-white outline-none"
        >
          {result.passed ? t('summary.complete') : t('summary.notPassed')}
        </h1>
        <p className="max-w-2xl text-slate-300">
          {result.passed
            ? next
              ? t('summary.passedNext', { title: tx(next.title) })
              : t('summary.passedLast')
            : t('summary.failed', { score: format.percent(0.6) })}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t('summary.score')}
          value={format.percent(result.score)}
          hint={t('summary.scoreHint')}
        />
        <StatTile
          label={t('summary.checkpoint')}
          value={checkpointScore === null ? '—' : format.percent(checkpointScore)}
        />
        <StatTile label={t('summary.firstTime')} value={`${firstTry}/${result.outcomes.length}`} />
        <StatTile
          label={t('summary.solutionsShown')}
          value={result.outcomes.filter((o) => o.revealed).length}
          hint={t('summary.solutionsHint')}
        />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('summary.keyPoints')}</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-200">
            {lesson.keyPoints.map((point) => (
              <li key={textId(point)}>
                <InlineText text={point} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-white">{t('summary.mastery')}</h2>
          <div className="flex flex-col gap-4">
            {concepts.map((concept) => (
              <MasteryMeter
                key={concept.id}
                name={concept.name}
                mastery={progress?.mastery[concept.id]}
              />
            ))}
          </div>
          {result.passed && (
            <p className="mt-4 text-xs text-slate-400">
              {t('summary.reviewNote', { concepts: tx(joinText(concepts.map((c) => c.name))) })}
            </p>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {result.passed && next && (
          <ButtonLink to={`/learn/${next.id}`}>
            {t('summary.nextLesson', { title: tx(next.title) })} →
          </ButtonLink>
        )}
        <Button variant={result.passed ? 'secondary' : 'primary'} onClick={onRetry}>
          {t('summary.replay')}
        </Button>
        <ButtonLink variant="ghost" to="/learn">
          {t('learningPath')}
        </ButtonLink>
      </div>

      <TrainingLinks links={concepts.flatMap((c) => c.cognitiveLinks)} />

      {saveFailed && (
        <p role="alert" className="text-sm text-rose-300">
          {t('summary.saveFailed')}
        </p>
      )}
    </article>
  );
}
