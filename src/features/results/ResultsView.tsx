import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { lessonsOf } from '@/domain/learning';
import { useCourse } from '@/app/providers/useCourse';
import { Suspense, useEffect, useRef } from 'react';
import type { Challenge } from '@/domain/challenge';
import type { GameResult } from '@/domain/session';
import { stepLevel, tierOf, type DifficultyLevel } from '@/domain/shared';
import type { GameModule } from '@/games/types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { StatTile } from '@/components/ui/StatTile';
import { describeAnswer, describeSolution } from '@/features/play/describe';
import type { PersistStatus } from '@/features/play/usePersistResult';
import { compareWith } from '@/domain/insights';
import { useServices } from '@/app/providers/servicesContext';
import { useFormat, useText } from '@/i18n';
import { useProgress } from '@/features/shared/useProgress';

interface Props {
  readonly module: GameModule;
  readonly result: GameResult;
  readonly challenges: readonly Challenge[];
  readonly saveStatus: PersistStatus;
  readonly onRestart: (options: { level: DifficultyLevel; seed?: number }) => void;
}

function performanceLabel(index: number, completed: boolean): string {
  // An index over a handful of answers is not a verdict on the level.
  if (!completed) return 'results.label.endedEarly';
  if (index >= 90) return 'results.label.excellent';
  if (index >= 70) return 'results.label.cleared';
  if (index >= 50) return 'results.label.gettingThere';
  return 'results.label.keepGoing';
}

/** "In this game, your accuracy was higher than in your last comparable session." */
function Comparison({ result }: { result: GameResult }) {
  const { t } = useTranslation('play');
  const format = useFormat();
  const { progress } = useServices();
  const { state } = useProgress(progress);
  if (state.status !== 'ready' || !result.completed) return null;
  const comparison = compareWith(state.progress.recentSessions, {
    gameId: result.gameId,
    level: result.level,
    seed: result.seed,
    score: result.score.total,
    accuracy: result.metrics.accuracy,
    performanceIndex: result.score.performanceIndex,
    completed: result.completed,
    assisted: result.assisted,
    endedAt: result.endedAt,
    durationMs: result.durationMs,
  });
  const values =
    comparison === null
      ? { level: result.level }
      : {
          level: result.level,
          before: format.percent(comparison.previous.accuracy),
          after: format.percent(result.metrics.accuracy),
          delta: `${comparison.performanceDelta >= 0 ? '+' : ''}${format.number(comparison.performanceDelta)}`,
        };
  const text =
    comparison === null
      ? t('results.comparison.first', values)
      : comparison.accuracyDelta > 0.001
        ? t('results.comparison.higher', values)
        : comparison.accuracyDelta < -0.001
          ? t('results.comparison.lower', values)
          : t('results.comparison.same', values);
  return (
    <p className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
      <span className="font-semibold text-ink">{t('results.comparison.title')} </span>
      {text}
    </p>
  );
}

/** TRAIN → LEARN: lessons whose concepts rely on the skill this game practises. */
function RelatedLessons({ gameId }: { gameId: string }) {
  const { t } = useTranslation('play');
  const tx = useText();
  const course = useCourse();
  const linked = course.concepts.filter((c) =>
    c.cognitiveLinks.some((link) => link.gameId === gameId),
  );
  const relatedLessons = lessonsOf(course)
    .filter((lesson) => lesson.concepts.some((id) => linked.some((c) => c.id === id)))
    .slice(0, 3);
  if (relatedLessons.length === 0) return null;
  return (
    <section
      aria-labelledby="related-title"
      className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-5 text-sm"
    >
      <h2 id="related-title" className="font-semibold text-violet-200">
        {t('results.related.title')}
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {relatedLessons.map((lesson) => (
          <li key={lesson.id}>
            <Link
              to={`/learn/${lesson.id}`}
              className="inline-flex rounded-md border border-violet-400/40 px-2 py-1 text-violet-100 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              {t('results.related.lesson', { lesson: tx(lesson.title) })}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResultsView({ module, result, challenges, saveStatus, onRestart }: Props) {
  const { t } = useTranslation('play');
  const tx = useText();
  const format = useFormat();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { metrics, score, recommendation, level } = result;
  const mistakes = result.records
    .map((record, i) => ({ record, challenge: challenges[i] }))
    .filter(
      (entry): entry is { record: typeof entry.record; challenge: Challenge } =>
        entry.challenge !== undefined &&
        (entry.record.outcome === 'incorrect' || entry.record.outcome === 'timed-out'),
    );
  const kinds = Object.entries(metrics.byKind);
  const labels = module.kindLabels;
  const { meta, scoring } = module.definition;
  const accuracyShare = Math.round((scoring?.accuracyWeight ?? 0.75) * 100);
  const timed = meta.measures.includes('response-time');
  const reaction = meta.measures.includes('reaction-time');
  // The weakest challenge type, named as something to practise, never as a deficit.
  const weakest = kinds
    .filter(([, t]) => t.total > 0 && t.correct < t.total)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)[0];

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <article aria-labelledby="results-title" className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          {tx(module.definition.name)} · {t('common:level.label', { level })} ·{' '}
          {t(`common:tiers.${tierOf(level)}`)}
        </p>
        <h1
          id="results-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-semibold text-white outline-none"
        >
          {t(performanceLabel(score.performanceIndex, result.completed))}
        </h1>
        {!result.completed && (
          <p className="text-sm text-amber-300">{t('results.endedEarlyNote')}</p>
        )}
        {result.assisted && <p className="text-sm text-sky-300">{t('results.relaxedNote')}</p>}
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t('results.stats.performance')}
          value={`${score.performanceIndex}/100`}
          hint={t('results.stats.performanceHint', {
            accuracy: format.percent(accuracyShare / 100),
            pace: format.percent((100 - accuracyShare) / 100),
          })}
        />
        <StatTile
          label={t('results.stats.score')}
          value={format.points(score.total)}
          hint={t('results.stats.scoreHint', { max: format.points(score.maxPossible) })}
        />
        <StatTile
          label={t('results.stats.accuracy')}
          value={metrics.attempted === 0 ? '—' : format.percent(metrics.accuracy)}
          hint={t('results.stats.accuracyHint', {
            correct: format.number(metrics.correct),
            attempted: format.number(metrics.attempted),
          })}
        />
        {reaction ? (
          <StatTile
            label={t('results.stats.medianReaction')}
            value={format.ms(metrics.medianReactionMs)}
            hint={t('results.stats.medianReactionHint')}
          />
        ) : (
          <StatTile
            label={timed ? t('results.stats.medianTime') : t('results.stats.medianAnswerTime')}
            value={format.ms(metrics.medianResponseMs)}
            hint={
              timed
                ? t('results.stats.timeHint', {
                    average: format.ms(metrics.averageResponseMs),
                    best: format.ms(metrics.fastestResponseMs),
                  })
                : t('results.stats.untimedHint')
            }
          />
        )}
        <StatTile label={t('results.stats.longestStreak')} value={metrics.longestStreak} />
        <StatTile label={t('results.stats.timeouts')} value={metrics.timedOut} />
        <StatTile label={t('results.stats.duration')} value={format.ms(result.durationMs)} />
        <StatTile
          label={t('results.stats.seed')}
          value={result.seed}
          hint={t('results.stats.seedHint')}
        />
      </dl>

      <section
        aria-labelledby="recommendation-title"
        className="rounded-xl border border-sky-400/30 bg-sky-400/5 p-5"
      >
        <h2 id="recommendation-title" className="text-sm font-semibold text-sky-200">
          {t('results.recommendation.title', {
            direction: t(`results.direction.${recommendation.direction}`),
            level: recommendation.level,
          })}
        </h2>
        <p className="mt-1 text-sm text-slate-300">{tx(recommendation.reason)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              onRestart({ level });
            }}
          >
            {t('results.actions.repeat')}
          </Button>
          {level < 10 && (
            <Button
              variant="secondary"
              onClick={() => {
                onRestart({ level: stepLevel(level, 1) });
              }}
            >
              {t('results.actions.nextLevel')} <span aria-hidden="true">→</span>
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              onRestart({ level, seed: result.seed });
            }}
          >
            {t('results.actions.replaySeed')}
          </Button>
          <ButtonLink variant="ghost" to={`/games/${module.definition.id}`}>
            {t('results.actions.backToGame')}
          </ButtonLink>
        </div>
      </section>

      <Comparison result={result} />

      {weakest && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
          <span className="font-semibold text-ink">{t('results.practise.title')} </span>
          {t('results.practise.detail', {
            kind: tx(labels[weakest[0]] ?? weakest[0]),
            correct: weakest[1].correct,
            total: weakest[1].total,
          })}
        </p>
      )}

      {meta.category === 'programming' && (
        <Suspense fallback={null}>
          <RelatedLessons gameId={module.definition.id} />
        </Suspense>
      )}

      {kinds.length > 0 && (
        <section aria-labelledby="breakdown-title">
          <h2 id="breakdown-title" className="mb-3 text-lg font-semibold text-white">
            {t('results.breakdown')}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {kinds.map(([kind, tally]) => (
              <li
                key={kind}
                className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-2 text-sm"
              >
                <span>{tx(labels[kind] ?? kind)}</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {tally.correct}/{tally.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="mistakes-title">
        <h2 id="mistakes-title" className="mb-3 text-lg font-semibold text-white">
          {mistakes.length === 0
            ? t('results.review.none')
            : t('results.review.count', { total: mistakes.length })}
        </h2>
        <ol className="flex flex-col gap-3">
          {mistakes.map(({ record, challenge }) => (
            <li key={record.challengeId} className="rounded-lg border border-slate-800 p-4 text-sm">
              <p className="font-medium text-white">{tx(challenge.prompt)}</p>
              <p className="mt-1 text-slate-300">
                {record.outcome === 'timed-out' ? (
                  t('results.review.timedOut')
                ) : (
                  <>
                    {t('results.review.youAnswered')}{' '}
                    <span className="font-mono">
                      {tx(describeAnswer(challenge, record.answer))}
                    </span>
                  </>
                )}{' '}
                · {t('feedback.correctAnswer')}{' '}
                <span className="font-mono font-semibold text-emerald-300">
                  {tx(describeSolution(challenge))}
                </span>
              </p>
              <p className="mt-2 text-slate-400">{tx(challenge.explanation)}</p>
            </li>
          ))}
        </ol>
      </section>

      <p role="status" className="text-xs text-slate-500">
        {saveStatus === 'saving' && t('results.save.saving')}
        {saveStatus === 'saved' && t('results.save.saved')}
        {saveStatus === 'failed' && t('results.save.failed')}
      </p>
    </article>
  );
}
