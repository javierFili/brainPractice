import { useTranslation } from 'react-i18next';
import { joinText } from '@/domain/shared';
import { useText } from '@/i18n';
import type { ContentViewProps } from '@/games/types';
import { needsOf } from '../content/graph';
import { taskLabel, themeLabel } from '../content/themes';
import type { DependencyChallenge } from '../content/types';

export function DependencyOrderingView({
  challenge,
  phase,
}: ContentViewProps<DependencyChallenge>) {
  const { t } = useTranslation('programming');
  const tx = useText();
  const { theme, tasks, needs, done, kind } = challenge.content;
  const { response } = challenge;
  const finished = new Set(done);
  const solution =
    phase === 'review' && response.format === 'ordering'
      ? response.solution.order.map((id) => {
          const item = response.question.items.find((candidate) => candidate.id === id);
          return item === undefined ? id : tx(item.label);
        })
      : null;
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
          {t('dependencyOrdering.view.heading', {
            theme: tx(themeLabel(theme)),
            count: tasks.length,
          })}
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2" aria-label={t('dependencyOrdering.view.tasks')}>
          {tasks.map((task) => {
            const list = needsOf(needs, task);
            const isDone = finished.has(task);
            return (
              <li
                key={task}
                className={`rounded-lg border px-3 py-2 text-sm ${isDone ? 'border-success/50 bg-success/10' : 'border-line bg-raised'}`}
              >
                <span className="font-semibold text-ink">
                  {isDone && (
                    <span aria-hidden="true" className="text-success">
                      ✓{' '}
                    </span>
                  )}
                  {tx(taskLabel(task))}
                </span>
                {isDone && <span className="sr-only"> {t('dependencyOrdering.view.done')}</span>}
                <span className="block text-ink-muted">
                  {list.length === 0
                    ? t('dependencyOrdering.view.needsNothing')
                    : t('dependencyOrdering.view.needs', {
                        list: tx(joinText(list.map(taskLabel), ', ')),
                      })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {kind === 'cycle' && (
        <p className="text-sm text-ink-soft">{t('dependencyOrdering.view.cycleHint')}</p>
      )}
      {solution !== null && (
        <p className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft">
          {t('dependencyOrdering.view.validOrder')}{' '}
          <span className="font-semibold text-ink">{solution.join(' → ')}</span>
        </p>
      )}
    </div>
  );
}
