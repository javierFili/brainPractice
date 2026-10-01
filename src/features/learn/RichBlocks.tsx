import type { FlowNode, RichBlock } from '@/domain/learning';
import { CodeBlock } from '@/components/code/CodeBlock';

/** Renders `inline code` between backticks; everything else is plain text (never HTML). */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code
            key={i}
            className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.9em] text-sky-200"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const CALLOUT = {
  key: { label: 'Key idea', tone: 'border-sky-400/40 bg-sky-400/5', icon: '◆' },
  tip: { label: 'Tip', tone: 'border-emerald-400/40 bg-emerald-400/5', icon: '✦' },
  warning: { label: 'Watch out', tone: 'border-amber-400/40 bg-amber-400/5', icon: '!' },
} as const;

function FlowChart({ nodes, caption }: { nodes: readonly FlowNode[]; caption?: string }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const shape = (node: FlowNode) =>
    node.kind === 'decision'
      ? 'border-violet-400/60 bg-violet-400/10 rounded-lg'
      : node.kind === 'action'
        ? 'border-slate-600 bg-slate-900 rounded-md'
        : 'border-sky-400/50 bg-sky-400/10 rounded-full';
  return (
    <figure className="flex flex-col items-start gap-2">
      <ol
        className="flex flex-col items-center gap-1 self-center font-mono text-sm"
        aria-label="Flowchart"
      >
        {nodes.map((node, i) => (
          <li key={node.id} className="flex flex-col items-center gap-1">
            {i > 0 && (
              <span aria-hidden="true" className="text-slate-500">
                ↓
              </span>
            )}
            <span className={`border px-4 py-1.5 text-center text-slate-100 ${shape(node)}`}>
              {node.kind === 'decision' && <span className="sr-only">Decision: </span>}
              {node.label}
            </span>
            {node.kind === 'decision' && (
              <span className="flex gap-4 text-xs">
                <span className="text-emerald-300">
                  YES → {byId.get(node.yes)?.label ?? node.yes}
                </span>
                <span className="text-rose-300">NO → {byId.get(node.no)?.label ?? node.no}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      {caption !== undefined && (
        <figcaption className="text-xs text-slate-400">{caption}</figcaption>
      )}
    </figure>
  );
}

export function RichBlocks({ blocks }: { blocks: readonly RichBlock[] }) {
  return (
    <div className="flex max-w-3xl flex-col gap-4 leading-relaxed text-slate-200">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'paragraph':
            return (
              <p key={i}>
                <InlineText text={block.text} />
              </p>
            );
          case 'code':
            return (
              <CodeBlock
                key={i}
                source={block.source}
                {...(block.caption === undefined ? {} : { caption: block.caption })}
              />
            );
          case 'callout': {
            const meta = CALLOUT[block.tone];
            return (
              <aside key={i} className={`rounded-lg border p-3 text-sm ${meta.tone}`}>
                <p className="mb-1 text-xs font-semibold tracking-wide text-slate-300 uppercase">
                  <span aria-hidden="true">{meta.icon} </span>
                  {meta.label}
                </p>
                <p>
                  <InlineText text={block.text} />
                </p>
              </aside>
            );
          }
          case 'list':
            return (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {block.items.map((item) => (
                  <li key={item}>
                    <InlineText text={item} />
                  </li>
                ))}
              </ul>
            );
          case 'flow':
            return (
              <FlowChart
                key={i}
                nodes={block.nodes}
                {...(block.caption === undefined ? {} : { caption: block.caption })}
              />
            );
        }
      })}
    </div>
  );
}
