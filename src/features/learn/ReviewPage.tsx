import { useCourse } from '@/app/providers/useCourse';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { joinText, msg } from '@/domain/shared';
import { useFormat, useText } from '@/i18n';
import {
  applyReviewResult,
  conceptOf,
  DAY_MS,
  planReview,
  type LearningProgress,
  type LessonSessionState,
} from '@/domain/learning';
import { mulberry32, toSeed } from '@/domain/random';
import { useServices } from '@/app/providers/servicesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageLoading } from '@/features/shared/PageLoading';
import { useRecordActivity } from '@/features/shared/useProfile';
import { relativeDay } from './dates';
import { LessonPlayer } from './LessonPlayer';
import { useLearning } from './useLearning';

/** A few minutes of retrieval practice on concepts whose review is due (spaced repetition). */
export function ReviewPage() {
  const { t } = useTranslation(['learn', 'lessons']);
  const tx = useText();
  const format = useFormat();
  const { clock } = useServices();
  const course = useCourse();
  const { state, update } = useLearning();
  const recordActivity = useRecordActivity();
  const [started] = useState(() => clock.now());
  const [done, setDone] = useState<{
    before: LearningProgress;
    after: LearningProgress | null;
    credit: number;
  } | null>(null);

  const onFinished = useCallback(
    (final: LessonSessionState) => {
      if (state.status !== 'ready') return;
      const before = state.value;
      const outcomes = final.outcomes;
      const credit =
        outcomes.length === 0
          ? 0
          : outcomes.reduce((sum, o) => sum + o.effective, 0) / outcomes.length;
      setDone({ before, after: null, credit });
      recordActivity();
      update((current) =>
        applyReviewResult(current, { outcomes, endedAt: final.endedAt ?? clock.now() }),
      )
        .then((after) => {
          setDone({ before, after, credit });
        })
        .catch((error: unknown) => {
          console.error('[learn] Could not save the review', error);
        });
    },
    [state, update, clock, recordActivity],
  );

  if (state.status === 'loading') return <PageLoading />;
  if (state.status === 'error')
    return (
      <p role="alert" className="text-rose-300">
        {t('loadError')}
      </p>
    );

  // One review plan per day: reloading the page does not reshuffle it.
  const plan = planReview(
    course,
    done?.before ?? state.value,
    started,
    mulberry32(toSeed(Math.floor(started / DAY_MS))),
  );

  if (done) {
    const now = clock.now();
    return (
      <>
        <PageHeader
          eyebrow={t('review.eyebrow')}
          title={t('review.done')}
          description={t('review.score', { score: format.percent(done.credit) })}
        />
        <Card>
          <ul className="flex flex-col gap-2 text-sm">
            {plan.concepts.map((id) => {
              const item = done.after?.reviews[id];
              return (
                <li key={id} className="flex flex-wrap justify-between gap-2">
                  <span className="text-white">{tx(conceptOf(course, id)?.name ?? id)}</span>
                  <span className="text-slate-400">
                    {item
                      ? t('review.next', {
                          when: relativeDay(item.dueAt, now, format.language),
                          box: item.box,
                          boxes: 5,
                        })
                      : t('review.saving')}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
        <div className="mt-6 flex gap-2">
          <ButtonLink to="/learn">{t('review.back')}</ButtonLink>
        </div>
      </>
    );
  }

  if (plan.steps.length === 0)
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-semibold text-white">{t('review.empty')}</h1>
        <p className="mt-2 text-slate-400">{t('review.emptyNote')}</p>
        <ButtonLink to="/learn" className="mt-6">
          {t('learningPath')}
        </ButtonLink>
      </div>
    );

  return (
    <LessonPlayer
      title={msg('learn:review.title', {
        concepts: joinText(
          plan.concepts.map((id) => conceptOf(course, id)?.name ?? id),
          ', ',
        ),
      })}
      lessonId={null}
      steps={plan.steps}
      onFinished={onFinished}
    />
  );
}
