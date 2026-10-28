import type { ContentViewProps } from '@/games/types';
import { needsOf } from '../content/graph';
import type { DependencyChallenge } from '../content/types';

export function DependencyOrderingView({
  challenge,
  phase,
}: ContentViewProps<DependencyChallenge>) {
  const { theme, tasks, needs, done, kind } = challenge.content;
  const { response } = challenge;
  const finished = new Set(done);
  const solution =
    phase === 'review' && response.format === 'ordering'
      ? response.solution.order.map(
          (id) => response.question.items.find((item) => item.id === id)?.label ?? id,
        )
      : null;
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
          {theme} · {tasks.length} tasks
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Tasks and what each one needs">
          {tasks.map((task) => {
            const list = needsOf(needs, task);
            const isDone = finished.has(task);
            return (
              <li
                key={task}
                className={`rounded-lg border px-3 py-2 text-sm ${isDone ? 'border-success/50 bg-success/10' : 'border-line bg-raised'}`}
              >
                <span className="font-mono font-semibold text-ink">
                  {isDone && (
                    <span aria-hidden="true" className="text-success">
                      ✓{' '}
                    </span>
                  )}
                  {task}
                </span>
                {isDone && <span className="sr-only"> (done)</span>}
                <span className="block text-ink-muted">
                  {list.length === 0 ? 'needs nothing' : `needs ${list.join(', ')}`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {kind === 'cycle' && (
        <p className="text-sm text-ink-soft">
          Each option adds one new need to the list above. Exactly one of them closes a loop.
        </p>
      )}
      {solution !== null && (
        <p className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft">
          Valid order: <span className="font-mono text-ink">{solution.join(' → ')}</span>
        </p>
      )}
    </div>
  );
}
