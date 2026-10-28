import type { ContentViewProps } from '@/games/types';
import { HiddenNote } from '../../shared/ui/HiddenNote';
import type { ChunkedNumber, NumberRecallChallenge } from '../content/types';

/** Digits are read one by one by screen readers ("4 8 2"), chunk by chunk. */
const readable = (n: ChunkedNumber) =>
  `${n.label}: ${n.groups.map((g) => g.split('').join(' ')).join(', ')}`;

function NumberCard({ n, asked }: { readonly n: ChunkedNumber; readonly asked: boolean }) {
  return (
    <li
      aria-label={`${readable(n)}${asked ? ', asked' : ''}`}
      className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-3 ${asked ? 'border-brand bg-brand/10' : 'border-line bg-raised'}`}
    >
      <span aria-hidden="true" className="text-sm text-ink-muted">
        {n.label}
      </span>
      <span aria-hidden="true" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {n.groups.map((g, i) => (
          <span
            key={`${g}-${i}`}
            className="font-mono text-3xl font-semibold tracking-wider text-ink sm:text-4xl"
          >
            {g}
          </span>
        ))}
      </span>
    </li>
  );
}

export function NumberRecallView({ challenge, phase }: ContentViewProps<NumberRecallChallenge>) {
  const { numbers, ask, kind } = challenge.content;
  if (phase === 'respond') {
    return (
      <HiddenNote>
        {kind === 'which-group'
          ? 'Hidden — pick the chunk from memory.'
          : 'Hidden — type the digits from memory, without spaces.'}
      </HiddenNote>
    );
  }
  return (
    <ul aria-label="Numbers" className="flex flex-col items-center gap-3">
      {numbers.map((n, i) => (
        <NumberCard
          key={n.label}
          n={n}
          asked={phase === 'review' && i === ask.number && numbers.length > 1}
        />
      ))}
    </ul>
  );
}
