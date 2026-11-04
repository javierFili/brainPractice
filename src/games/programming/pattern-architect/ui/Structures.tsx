import { useTranslation } from 'react-i18next';
import { formatTree } from '../content/solvers/treeOps';
import type { Digraph, NamedGraph, TreeNode } from '../content/types';

const HEADING = 'mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase';

/** Adjacency list: one line per node with the nodes it points to. */
export function ArrowList({ graph, label }: { graph: Digraph; label: string }) {
  const { t } = useTranslation('programming');
  return (
    <ul className="space-y-1 text-sm" aria-label={label}>
      {graph.nodes.map((node) => {
        const targets = graph.edges.filter(([from]) => from === node).map(([, to]) => to);
        return (
          <li key={node}>
            <span className="font-mono text-slate-100">{node}</span>{' '}
            <span aria-label={t('patternArchitect.view.pointsTo')} className="text-emerald-300">
              →
            </span>{' '}
            {targets.length > 0 ? (
              <span className="font-mono text-slate-200">{targets.join(', ')}</span>
            ) : (
              <span className="text-slate-500">{t('patternArchitect.view.nothing')}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function StructureMatchView({
  reference,
  candidates,
}: {
  reference: Digraph;
  candidates: readonly NamedGraph[];
}) {
  const { t } = useTranslation('programming');
  return (
    <div className="flex flex-col gap-5">
      <section
        aria-labelledby="reference-graph"
        className="rounded-lg border border-emerald-400/40 bg-emerald-400/5 p-3"
      >
        <h3 id="reference-graph" className={HEADING}>
          {t('patternArchitect.view.reference', {
            nodes: reference.nodes.length,
            arrows: reference.edges.length,
          })}
        </h3>
        <ArrowList graph={reference} label={t('patternArchitect.view.referenceArrows')} />
      </section>
      <ul className="grid gap-3 sm:grid-cols-2" aria-label={t('patternArchitect.view.candidates')}>
        {candidates.map(({ name, graph }) => (
          <li key={name} className="rounded-lg border border-slate-700 p-3">
            <h3 className={HEADING}>{t('patternArchitect.structure.graph', { name })}</h3>
            <ArrowList graph={graph} label={t('patternArchitect.view.graphArrows', { name })} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Outline({ tree }: { tree: TreeNode }) {
  return (
    <li>
      <span className="font-mono text-sm text-slate-100">{tree.label}</span>
      {tree.children.length > 0 && (
        <ul className="ml-2 border-l border-slate-700 pl-3">
          {tree.children.map((child) => (
            <Outline key={child.label} tree={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** A tree drawn as an indented outline, with its one-line notation underneath. */
export function TreeFigure({ tree, label }: { tree: TreeNode; label: string }) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <ul aria-label={label}>
        <Outline tree={tree} />
      </ul>
      <figcaption className="font-mono text-xs break-words text-emerald-300">
        {formatTree(tree)}
      </figcaption>
    </figure>
  );
}
