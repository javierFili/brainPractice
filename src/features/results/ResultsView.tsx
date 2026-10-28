import { Link } from 'react-router';
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
import { formatMs, formatPercent, formatPoints } from '@/features/shared/format';
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
  if (!completed) return 'Session ended early';
  if (index >= 90) return 'Excellent session';
  if (index >= 70) return 'Level cleared';
  if (index >= 50) return 'Getting there';
  return 'Good practice — keep going';
}

const DIRECTION = { up: '↑ Level up', stay: '→ Stay', down: '↓ Step back' } as const;

/** "In this game, your accuracy was higher than in your last comparable session." */
function Comparison({ result }: { result: GameResult }) {
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
  const text =
    comparison === null
      ? `This is your first completed session at level ${result.level} in this mode, so there is nothing comparable yet.`
      : comparison.accuracyDelta > 0.001
        ? `In this game, your accuracy was higher than in your last comparable session (level ${result.level}): ${formatPercent(comparison.previous.accuracy)} → ${formatPercent(result.metrics.accuracy)}.`
        : comparison.accuracyDelta < -0.001
          ? `Your accuracy was lower than in your last comparable session (${formatPercent(comparison.previous.accuracy)} → ${formatPercent(result.metrics.accuracy)}). Results vary from session to session; that is normal.`
          : `Your accuracy matched your last comparable session (${formatPercent(result.metrics.accuracy)}); performance ${comparison.performanceDelta >= 0 ? '+' : ''}${comparison.performanceDelta}.`;
  return (
    <p className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
      <span className="font-semibold text-ink">Compared with last time: </span>
      {text}
    </p>
  );
}

/** TRAIN → LEARN: lessons whose concepts rely on the skill this game practises. */
function RelatedLessons({ gameId }: { gameId: string }) {
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
        Where this skill shows up in programming
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {relatedLessons.map((lesson) => (
          <li key={lesson.id}>
            <Link
              to={`/learn/${lesson.id}`}
              className="inline-flex rounded-md border border-violet-400/40 px-2 py-1 text-violet-100 hover:bg-violet-400/10 focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              Lesson: {lesson.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResultsView({ module, result, challenges, saveStatus, onRestart }: Props) {
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
          {module.definition.name} · Level {level} · {tierOf(level)}
        </p>
        <h1
          id="results-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-semibold text-white outline-none"
        >
          {performanceLabel(score.performanceIndex, result.completed)}
        </h1>
        {!result.completed && (
          <p className="text-sm text-amber-300">
            Unanswered challenges were skipped and it does not count toward records.
          </p>
        )}
        {result.assisted && (
          <p className="text-sm text-sky-300">
            Relaxed timing session — saved to history, not to records.
          </p>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Performance"
          value={`${score.performanceIndex}/100`}
          hint={`${accuracyShare}% accuracy · ${100 - accuracyShare}% pace`}
        />
        <StatTile
          label="Score"
          value={formatPoints(score.total)}
          hint={`of ${formatPoints(score.maxPossible)} possible`}
        />
        <StatTile
          label="Accuracy"
          value={metrics.attempted === 0 ? '—' : formatPercent(metrics.accuracy)}
          hint={`${metrics.correct} of ${metrics.attempted} correct`}
        />
        {reaction ? (
          <StatTile
            label="Median reaction"
            value={formatMs(metrics.medianReactionMs)}
            hint="signal to tap, correct taps only"
          />
        ) : (
          <StatTile
            label={timed ? 'Median time' : 'Median answer time'}
            value={formatMs(metrics.medianResponseMs)}
            hint={
              timed
                ? `avg ${formatMs(metrics.averageResponseMs)} · best ${formatMs(metrics.fastestResponseMs)}`
                : 'untimed game: shown for information only'
            }
          />
        )}
        <StatTile label="Longest streak" value={metrics.longestStreak} />
        <StatTile label="Time-outs" value={metrics.timedOut} />
        <StatTile label="Duration" value={formatMs(result.durationMs)} />
        <StatTile label="Seed" value={result.seed} hint="Replay the exact same challenges" />
      </dl>

      <section
        aria-labelledby="recommendation-title"
        className="rounded-xl border border-sky-400/30 bg-sky-400/5 p-5"
      >
        <h2 id="recommendation-title" className="text-sm font-semibold text-sky-200">
          Recommendation: {DIRECTION[recommendation.direction]} (level {recommendation.level})
        </h2>
        <p className="mt-1 text-sm text-slate-300">{recommendation.reason}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              onRestart({ level });
            }}
          >
            Repeat level
          </Button>
          {level < 10 && (
            <Button
              variant="secondary"
              onClick={() => {
                onRestart({ level: stepLevel(level, 1) });
              }}
            >
              Next level →
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              onRestart({ level, seed: result.seed });
            }}
          >
            Replay this seed
          </Button>
          <ButtonLink variant="ghost" to={`/games/${module.definition.id}`}>
            Back to game
          </ButtonLink>
        </div>
      </section>

      <Comparison result={result} />

      {weakest && (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-soft">
          <span className="font-semibold text-ink">Something to practise: </span>
          {labels[weakest[0]] ?? weakest[0]} ({weakest[1].correct}/{weakest[1].total} this session).
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
            By challenge type
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {kinds.map(([kind, tally]) => (
              <li
                key={kind}
                className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-2 text-sm"
              >
                <span>{labels[kind] ?? kind}</span>
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
          Review {mistakes.length === 0 ? '— no mistakes 🎯' : `(${mistakes.length})`}
        </h2>
        <ol className="flex flex-col gap-3">
          {mistakes.map(({ record, challenge }) => (
            <li key={record.challengeId} className="rounded-lg border border-slate-800 p-4 text-sm">
              <p className="font-medium text-white">{challenge.prompt}</p>
              <p className="mt-1 text-slate-300">
                {record.outcome === 'timed-out' ? (
                  'Timed out'
                ) : (
                  <>
                    You answered{' '}
                    <span className="font-mono">{describeAnswer(challenge, record.answer)}</span>
                  </>
                )}{' '}
                · Correct:{' '}
                <span className="font-mono font-semibold text-emerald-300">
                  {describeSolution(challenge)}
                </span>
              </p>
              <p className="mt-2 text-slate-400">{challenge.explanation}</p>
            </li>
          ))}
        </ol>
      </section>

      <p role="status" className="text-xs text-slate-500">
        {saveStatus === 'saving' && 'Saving progress…'}
        {saveStatus === 'saved' && 'Progress saved on this device.'}
        {saveStatus === 'failed' && 'Progress could not be saved on this device.'}
      </p>
    </article>
  );
}
