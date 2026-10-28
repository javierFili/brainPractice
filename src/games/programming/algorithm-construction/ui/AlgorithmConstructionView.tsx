import { CodeBlock } from '@/components/code/CodeBlock';
import type { ContentViewProps } from '@/games/types';
import { ProgramPanel } from '../../shared/ui';
import type { ConstructionChallenge } from '../content/types';

export function AlgorithmConstructionView({
  challenge,
  phase,
}: ContentViewProps<ConstructionChallenge>) {
  const { blocks, target, kind } = challenge.content;
  const { response } = challenge;
  const solved =
    phase === 'review' && response.format === 'ordering'
      ? response.solution.order
          .slice(0, kind === 'spare-block' ? -1 : undefined)
          .map((id) => blocks.find((b) => b.id === id)?.code ?? '')
          .join('\n')
      : null;
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <p className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-soft">
        Target output:{' '}
        <span className="font-mono font-semibold text-ink">{target.join(' · ')}</span>
        {kind === 'spare-block' && (
          <span className="block text-ink-muted">One block is not needed: it goes last.</span>
        )}
      </p>
      {solved === null ? (
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Blocks to order">
          {blocks.map((block) => (
            <li key={block.id} className="min-w-0">
              <CodeBlock
                source={block.code}
                label={`Block ${block.id}`}
                caption={`Block ${block.id}`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ProgramPanel
          source={solved}
          phase={phase}
          label="The finished program"
          caption="The finished program"
        />
      )}
    </div>
  );
}
