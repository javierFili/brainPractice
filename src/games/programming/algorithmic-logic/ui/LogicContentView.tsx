import type { ContentViewProps } from '@/games/types';
import { describeRule } from '../content/solvers/constraints';
import type { LogicChallenge, TaskGraph } from '../content/types';
import { Pseudocode } from './Pseudocode';

function DependencyList({ graph, highlight }: { graph: TaskGraph; highlight?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
          Modules
        </h3>
        <ul className="flex flex-wrap gap-2" aria-label="Modules">
          {graph.nodes.map((node) => (
            <li
              key={node}
              className={`rounded-md border px-2 py-1 font-mono text-sm ${node === highlight ? 'border-violet-400 bg-violet-400/10 text-violet-200' : 'border-slate-700'}`}
            >
              {node}
              {graph.durations && (
                <span className="ml-1 text-xs text-slate-400">
                  ({graph.durations[node]} {graph.durations[node] === 1 ? 'round' : 'rounds'})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
          Dependencies · <span className="normal-case">x → y means x runs before y</span>
        </h3>
        <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Dependencies">
          {graph.edges.map(([from, to]) => (
            <li key={`${from}-${to}`} className="font-mono text-sm">
              <span className="text-slate-200">{from}</span>{' '}
              <span aria-label="before" className="text-violet-300">
                →
              </span>{' '}
              <span className="text-slate-200">{to}</span>
            </li>
          ))}
        </ul>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
          Same dependencies, grouped by module
        </summary>
        <dl className="mt-2 grid gap-1 font-mono sm:grid-cols-2">
          {graph.nodes.map((node) => {
            const needs = graph.edges.filter(([, to]) => to === node).map(([from]) => from);
            return (
              <div key={node} className="flex gap-2">
                <dt className="text-slate-200">{node}</dt>
                <dd className="text-slate-400">
                  {needs.length === 0 ? 'no prerequisites' : `needs ${needs.join(', ')}`}
                </dd>
              </div>
            );
          })}
        </dl>
      </details>
    </div>
  );
}

export function LogicContentView({ challenge }: ContentViewProps<LogicChallenge>) {
  const { content } = challenge;
  switch (content.kind) {
    case 'dependency-order':
    case 'critical-path':
      return <DependencyList graph={content.graph} />;
    case 'dependency-count':
      return <DependencyList graph={content.graph} highlight={content.target} />;
    case 'program-trace':
      return <Pseudocode program={content.program} />;
    case 'constraint-arrangement':
      return (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Services
            </h3>
            <ul className="flex flex-wrap gap-2">
              {content.entities.map((entity) => (
                <li
                  key={entity}
                  className="rounded-md border border-slate-700 px-2 py-1 font-mono text-sm"
                >
                  {entity}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Rules · slots 1–{content.entities.length}
            </h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-200">
              {content.rules.map((rule) => (
                <li key={JSON.stringify(rule)}>{describeRule(rule)}</li>
              ))}
            </ol>
          </div>
        </div>
      );
  }
}
