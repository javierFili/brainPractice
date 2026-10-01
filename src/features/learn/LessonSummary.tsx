import { useEffect, useRef } from 'react';
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
import { formatPercent } from '@/features/shared/format';
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
          {lesson.title}
        </p>
        <h1
          id="summary-title"
          ref={heading}
          tabIndex={-1}
          className="text-3xl font-semibold text-white outline-none"
        >
          {result.passed ? 'Lesson complete' : 'Not passed yet'}
        </h1>
        <p className="max-w-2xl text-slate-300">
          {result.passed
            ? next
              ? `You passed. “${next.title}” is now open.`
              : 'You passed the last lesson of this module.'
            : 'You need 60% to pass. Replaying the lesson is the fastest way to close the gap — the explanations will make more sense the second time.'}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Lesson score"
          value={formatPercent(result.score)}
          hint="Checkpoint counts double"
        />
        <StatTile
          label="Checkpoint"
          value={checkpointScore === null ? '—' : formatPercent(checkpointScore)}
        />
        <StatTile label="Right first time" value={`${firstTry}/${result.outcomes.length}`} />
        <StatTile
          label="Solutions shown"
          value={result.outcomes.filter((o) => o.revealed).length}
          hint="Revealed answers count as not yet learned"
        />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-white">Key points</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-200">
            {lesson.keyPoints.map((point) => (
              <li key={point}>
                <InlineText text={point} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-white">Mastery</h2>
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
              A short review of {concepts.map((c) => c.name).join(' and ')} will come back tomorrow,
              then at growing intervals — that is how it sticks.
            </p>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {result.passed && next && (
          <ButtonLink to={`/learn/${next.id}`}>Next lesson: {next.title} →</ButtonLink>
        )}
        <Button variant={result.passed ? 'secondary' : 'primary'} onClick={onRetry}>
          Replay lesson
        </Button>
        <ButtonLink variant="ghost" to="/learn">
          Learning path
        </ButtonLink>
      </div>

      <TrainingLinks links={concepts.flatMap((c) => c.cognitiveLinks)} />

      {saveFailed && (
        <p role="alert" className="text-sm text-rose-300">
          Your progress could not be saved on this device.
        </p>
      )}
    </article>
  );
}
