import { useState } from 'react';
import { COGNITIVE_AREAS, DIFFICULTY_LEVELS } from '@/domain/shared';
import { AREAS } from '@/features/shared/areas';
import { isLevelCleared } from '@/domain/progress';
import { useServices } from '@/app/providers/servicesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { formatMs, formatPercent, formatPoints } from '@/features/shared/format';
import { useProgress } from '@/features/shared/useProgress';

export function ProfilePage() {
  const { modules, progress, getModule } = useServices();
  const { state, clear } = useProgress(progress);
  const [confirming, setConfirming] = useState(false);

  if (state.status === 'loading') return <p className="text-slate-400">Loading progress…</p>;
  if (state.status === 'error')
    return (
      <p role="alert" className="text-rose-300">
        Progress could not be loaded.
      </p>
    );
  const { games, recentSessions, assessments = [] } = state.progress;
  const latest = assessments[0];

  return (
    <>
      <PageHeader
        eyebrow="Progress"
        title="Your training"
        description="Stored only in this browser. Best performance per level; a level is cleared at 70."
        actions={
          confirming ? (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  void clear().then(() => {
                    setConfirming(false);
                  });
                }}
              >
                Confirm reset
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirming(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(true);
              }}
              disabled={recentSessions.length === 0}
            >
              Reset progress
            </Button>
          )
        }
      />
      {latest && (
        <section
          aria-labelledby="assessment-title"
          className="mb-10 rounded-xl border border-slate-800 bg-slate-900/40 p-5"
        >
          <h2 id="assessment-title" className="text-lg font-semibold text-white">
            Latest Programming Cognitive Index: <span className="font-mono">{latest.overall}</span>
            <span className="text-slate-400">/100</span>
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {COGNITIVE_AREAS.map((area) => (
              <li key={area} className="rounded-md border border-slate-700 px-2 py-1">
                <span className={AREAS[area].accent}>{AREAS[area].label}</span>{' '}
                <span className="font-mono">{latest.areas[area] ?? '—'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="levels-title" className="mb-10">
        <h2 id="levels-title" className="mb-3 text-lg font-semibold text-white">
          Levels
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-separate border-spacing-1 text-sm">
            <caption className="sr-only">Best performance index per game and level</caption>
            <thead>
              <tr>
                <th scope="col" className="text-left font-medium text-slate-400">
                  Game
                </th>
                {DIFFICULTY_LEVELS.map((l) => (
                  <th key={l} scope="col" className="font-mono font-medium text-slate-400">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map(({ definition }) => (
                <tr key={definition.id}>
                  <th
                    scope="row"
                    className="pr-3 text-left font-medium whitespace-nowrap text-white"
                  >
                    {definition.name}
                  </th>
                  {DIFFICULTY_LEVELS.map((l) => {
                    const record = games[definition.id]?.[l];
                    const cleared = isLevelCleared(record);
                    return (
                      <td
                        key={l}
                        className={`h-10 rounded text-center font-mono ${record ? (cleared ? 'bg-emerald-400/15 text-emerald-200' : 'bg-slate-800 text-slate-200') : 'bg-slate-900 text-slate-600'}`}
                      >
                        {record ? record.bestPerformanceIndex : '·'}
                        {cleared && <span className="sr-only"> cleared</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className="mb-3 text-lg font-semibold text-white">
          Recent sessions
        </h2>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-slate-400">No sessions yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentSessions.slice(0, 15).map((s) => (
              <li
                key={`${s.gameId}-${s.endedAt}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 px-4 py-2 text-sm"
              >
                <span className="text-white">
                  {getModule(s.gameId)?.definition.name ?? s.gameId}{' '}
                  <span className="text-slate-400">· L{s.level}</span>
                  {!s.completed && <span className="ml-2 text-xs text-amber-300">ended early</span>}
                  {s.assisted && <span className="ml-2 text-xs text-sky-300">relaxed</span>}
                </span>
                <span className="font-mono text-slate-300 tabular-nums">
                  {s.performanceIndex}/100 · {formatPoints(s.score)} pts ·{' '}
                  {formatPercent(s.accuracy)} · {formatMs(s.durationMs)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
