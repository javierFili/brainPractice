import type { ContentViewProps } from '@/games/types';
import type { SequenceChallenge } from '../content/types';

export function NumberSequencesView({ challenge, phase }: ContentViewProps<SequenceChallenge>) {
  const { terms } = challenge.content;
  const solution = challenge.response.format === 'numeric' ? challenge.response.solution.value : 0;
  return (
    <ol aria-label="Sequence" className="flex flex-wrap justify-center gap-2">
      {terms.map((term, i) => {
        const hidden = term === null;
        const text = hidden ? (phase === 'review' ? String(solution) : '?') : String(term);
        return (
          <li
            key={i}
            aria-label={`Term ${i + 1}: ${hidden ? (phase === 'review' ? `${solution}, the answer` : 'missing') : text}`}
            className={`flex min-h-12 min-w-12 items-center justify-center rounded-lg border px-2 font-mono text-lg font-semibold ${
              hidden
                ? 'border-dashed border-brand bg-brand/15 text-brand'
                : 'border-line bg-raised text-ink'
            }`}
          >
            {text}
          </li>
        );
      })}
    </ol>
  );
}
