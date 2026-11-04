import { useTranslation } from 'react-i18next';
import type { FlowNode, RichBlock } from '@/domain/learning';
import { textId, type Text } from '@/domain/shared';
import { useText } from '@/i18n';
import { CodeBlock } from '@/components/code/CodeBlock';

/**
 * Renders a text in the reader's language: `inline code` between backticks becomes code;
 * everything else is plain text (never HTML).
 */
export function InlineText({ text }: { text: Text }) {
  const tx = useText();
  const parts = tx(text).split(/(`[^`]+`)/g);
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
  key: { tone: 'border-sky-400/40 bg-sky-400/5', icon: '◆' },
  tip: { tone: 'border-emerald-400/40 bg-emerald-400/5', icon: '✦' },
  warning: { tone: 'border-amber-400/40 bg-amber-400/5', icon: '!' },
} as const;

function FlowChart({ nodes, caption }: { nodes: readonly FlowNode[]; caption?: Text }) {
  const { t } = useTranslation('learn');
  const tx = useText();
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
        aria-label={t('blocks.flowchart')}
      >
        {nodes.map((node, i) => (
          <li key={node.id} className="flex flex-col items-center gap-1">
            {i > 0 && (
              <span aria-hidden="true" className="text-slate-500">
                ↓
              </span>
            )}
            <span className={`border px-4 py-1.5 text-center text-slate-100 ${shape(node)}`}>
              {node.kind === 'decision' && <span className="sr-only">{t('blocks.decision')} </span>}
              {tx(node.label)}
            </span>
            {node.kind === 'decision' && (
              <span className="flex gap-4 text-xs">
                <span className="text-emerald-300">
                  {t('blocks.yes')} → {tx(byId.get(node.yes)?.label ?? node.yes)}
                </span>
                <span className="text-rose-300">
                  {t('blocks.no')} → {tx(byId.get(node.no)?.label ?? node.no)}
                </span>
              </span>
            )}
          </li>
        ))}
      </ol>
      {caption !== undefined && (
        <figcaption className="text-xs text-slate-400">
          <InlineText text={caption} />
        </figcaption>
      )}
    </figure>
  );
}

export function RichBlocks({ blocks }: { blocks: readonly RichBlock[] }) {
  const { t } = useTranslation(['learn', 'lessons']);
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
                {...(block.caption === undefined
                  ? {}
                  : { caption: <InlineText text={block.caption} /> })}
              />
            );
          case 'callout': {
            const meta = CALLOUT[block.tone];
            return (
              <aside key={i} className={`rounded-lg border p-3 text-sm ${meta.tone}`}>
                <p className="mb-1 text-xs font-semibold tracking-wide text-slate-300 uppercase">
                  <span aria-hidden="true">{meta.icon} </span>
                  {t(`blocks.callout.${block.tone}`)}
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
                  <li key={textId(item)}>
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
