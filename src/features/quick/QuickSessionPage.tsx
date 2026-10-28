import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { pathById } from '@/content/paths';
import { planQuickSession, type QuickStep } from '@/domain/insights';
import { QUICK_SESSION_MINUTES, type QuickSessionMinutes } from '@/domain/preferences';
import type { UserProgress } from '@/domain/progress';
import type { GameResult } from '@/domain/session';
import type { GameSession } from '@/engine';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SessionRunner } from '@/features/play/SessionRunner';
import { saveSessionResult } from '@/features/play/usePersistResult';
import { catalogEntries, categoriesFor } from '@/features/shared/catalog';
import { CATEGORIES } from '@/features/shared/categories';
import { formatDuration, formatPercent } from '@/features/shared/format';
import { LoadError } from '@/features/shared/LoadError';
import { PageLoading } from '@/features/shared/PageLoading';
import { useRecordActivity } from '@/features/shared/useProfile';
import { useProgress } from '@/features/shared/useProgress';

const isQuickMinutes = (value: number): value is QuickSessionMinutes =>
  (QUICK_SESSION_MINUTES as readonly number[]).includes(value);

interface Run {
  readonly steps: readonly QuickStep[];
  readonly index: number;
  readonly session: GameSession;
  readonly results: readonly GameResult[];
}

/** A mixed session of short blocks; every block is saved as a regular session of its game. */
function QuickRun({
  steps,
  assisted,
  onDone,
}: {
  steps: readonly QuickStep[];
  assisted: boolean;
  onDone: (results: readonly GameResult[]) => void;
}) {
  const { engine, getModule, progress } = useServices();
  const recordActivity = useRecordActivity();
  const start = useCallback(
    (step: QuickStep) =>
      engine.startSession({
        gameId: step.gameId,
        level: step.level,
        challengeCount: step.challengeCount,
        assisted,
      }),
    [engine, assisted],
  );
  const [run, setRun] = useState<Run>(() => ({
    steps,
    index: 0,
    session: start(steps[0] as QuickStep),
    results: [],
  }));

  const finished = useCallback(
    (result: GameResult) => {
      saveSessionResult(progress, result).catch((error: unknown) => {
        console.error('[quick] Could not save a block', error);
      });
      if (result.metrics.attempted > 0) recordActivity();
      const results = [...run.results, result];
      const next = run.steps[run.index + 1];
      if (!next || !result.completed) {
        onDone(results);
        return;
      }
      setRun({ ...run, index: run.index + 1, session: start(next), results });
    },
    [run, progress, recordActivity, onDone, start],
  );

  const step = run.steps[run.index] as QuickStep;
  const module = getModule(step.gameId);
  if (!module) return <p role="alert">This activity is not available.</p>;
  const meta = CATEGORIES[module.definition.meta.category];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-ink-muted">
          Activity {run.index + 1} of {run.steps.length} ·{' '}
          <span className={meta.text}>{meta.label}</span>
        </p>
        <ProgressBar value={run.index} max={run.steps.length} label="Quick session progress" />
      </div>
      <SessionRunner
        key={run.index}
        module={module}
        session={run.session}
        onFinished={finished}
        endLabel="End quick session"
      />
    </div>
  );
}

function Summary({ results, onAgain }: { results: readonly GameResult[]; onAgain: () => void }) {
  const { getModule } = useServices();
  const played = results.filter((r) => r.metrics.attempted > 0);
  const total = played.reduce((s, r) => s + r.metrics.attempted, 0);
  const correct = played.reduce((s, r) => s + r.metrics.correct, 0);
  const time = results.reduce((s, r) => s + r.durationMs, 0);
  return (
    <section aria-labelledby="quick-done" className="flex flex-col gap-5">
      <h2 id="quick-done" className="text-2xl font-semibold text-ink">
        Session complete
      </h2>
      <p className="text-ink-soft">
        {played.length} {played.length === 1 ? 'activity' : 'activities'} · {formatDuration(time)} ·{' '}
        {total === 0
          ? 'nothing answered'
          : `${correct} of ${total} correct (${formatPercent(correct / total)})`}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {results.map((r, i) => (
          <li key={`${r.gameId}-${i}`} className="rounded-xl border border-line bg-surface p-4">
            <p className="font-semibold text-ink">
              {getModule(r.gameId)?.definition.name} · level {r.level}
            </p>
            <p className="text-sm text-ink-soft">
              {r.metrics.attempted === 0
                ? 'Not answered'
                : `${r.metrics.correct}/${r.metrics.attempted} correct · performance ${r.score.performanceIndex}/100`}
              {r.completed ? '' : ' · ended early'}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink-muted">
        Each activity was saved to its game’s history. Quick blocks are shorter than full sessions.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onAgain}>Another quick session</Button>
        <ButtonLink to="/progress" variant="secondary">
          See my progress
        </ButtonLink>
        <ButtonLink to="/" variant="ghost">
          Home
        </ButtonLink>
      </div>
    </section>
  );
}

function Planner({ progress }: { progress: UserProgress }) {
  const { modules, getModule, seeds } = useServices();
  const { preferences } = usePreferences();
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get('minutes'));
  const minutes: QuickSessionMinutes = isQuickMinutes(requested) ? requested : 5;
  const [assisted, setAssisted] = useState(preferences.relaxedByDefault);
  const [stage, setStage] = useState<
    | { kind: 'choose' }
    | { kind: 'run'; steps: QuickStep[]; key: number }
    | { kind: 'done'; results: readonly GameResult[] }
  >({ kind: 'choose' });
  const path = pathById(preferences.path);

  const plan = () =>
    planQuickSession({
      minutes,
      catalog: catalogEntries(modules),
      progress,
      featured: path?.featured ?? [],
      categories: categoriesFor(path),
      seed: seeds.next(),
      relaxedOnly: assisted,
      challengeCountOf: (id, level) => getModule(id)?.definition.levels[level].challengeCount ?? 4,
    });

  if (stage.kind === 'run')
    return (
      <QuickRun
        key={stage.key}
        steps={stage.steps}
        assisted={assisted}
        onDone={(results) => {
          setStage({ kind: 'done', results });
        }}
      />
    );
  if (stage.kind === 'done')
    return (
      <Summary
        results={stage.results}
        onAgain={() => {
          setStage({ kind: 'choose' });
        }}
      />
    );

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold text-ink">How long?</legend>
        <div
          role="radiogroup"
          aria-label="Duration"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {QUICK_SESSION_MINUTES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={m === minutes}
              onClick={() => {
                setParams({ minutes: String(m) }, { replace: true });
              }}
              className={`rounded-2xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-brand ${
                m === minutes
                  ? 'border-brand bg-brand/15'
                  : 'border-line bg-surface hover:bg-raised'
              }`}
            >
              <span className="block text-2xl font-semibold text-ink">{m} min</span>
              <span className="text-sm text-ink-muted">
                about {Math.max(1, Math.round(m / 2.5))} {m <= 3 ? 'activity' : 'activities'}
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={assisted}
          onChange={(e) => {
            setAssisted(e.target.checked);
          }}
          className="h-4 w-4 accent-brand"
        />
        No time pressure (relaxed timing; only games that work untimed)
      </label>
      <p className="text-sm text-ink-muted">
        Activities come from different areas{path ? ` and favour your ${path.name} route` : ''}, at
        the level suggested by your results. The real duration depends on your pace.
      </p>
      <div>
        <Button
          onClick={() => {
            setStage({ kind: 'run', steps: plan(), key: seeds.next() });
          }}
        >
          Start {minutes}-minute session
        </Button>
      </div>
    </div>
  );
}

export function QuickSessionPage() {
  const { progress } = useServices();
  const { state, reload } = useProgress(progress);
  return (
    <>
      <PageHeader
        eyebrow="Training"
        title="Quick session"
        description="Short mixed practice for busy days: 3, 5, 10 or 15 minutes."
      />
      {state.status === 'loading' ? (
        <PageLoading />
      ) : state.status === 'error' ? (
        <LoadError onRetry={reload} />
      ) : (
        <Planner progress={state.progress} />
      )}
    </>
  );
}
