import { MultiSelectBoard, useStepper } from '@/games/kit/ui';
import type { ContentViewProps } from '@/games/types';
import { HiddenNote } from '../../shared/ui/HiddenNote';
import type { WordRecallChallenge } from '../content/types';

function WordWithIndex({ word, index }: { readonly word: string; readonly index: number }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-line bg-raised px-3 py-1.5">
      <span className="font-mono text-xs text-ink-muted">{index + 1}.</span>
      <span className="text-ink">{word}</span>
    </li>
  );
}

export function WordRecallView({
  challenge,
  phase,
  respond,
  answer,
  assisted,
}: ContentViewProps<WordRecallChallenge>) {
  const { studied, board, itemMs, kind } = challenge.content;
  const { response } = challenge;
  const step = useStepper(
    studied.length,
    assisted ? itemMs * 1.5 : itemMs,
    phase === 'study',
    challenge.id,
  );

  if (phase === 'study') {
    const current = studied[step];
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          aria-live="assertive"
          aria-atomic="true"
          className="flex h-32 w-full max-w-xs items-center justify-center rounded-2xl border border-line bg-raised"
        >
          {current === undefined ? (
            <span className="text-sm text-ink-muted">Done — get ready</span>
          ) : (
            <span key={step} className="animate-pop text-3xl font-semibold text-ink sm:text-4xl">
              {current}
            </span>
          )}
        </div>
        <ol aria-hidden="true" className="flex flex-wrap justify-center gap-1.5">
          {studied.map((word, i) => (
            <li
              key={word}
              className={`h-2 w-5 rounded-full ${i <= step ? 'bg-brand' : 'bg-line'}`}
            />
          ))}
        </ol>
      </div>
    );
  }

  if (response.format === 'ordering') {
    if (phase === 'respond') {
      return <HiddenNote>Hidden — use the arrows below to put the words in order.</HiddenNote>;
    }
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-ink-muted">The words appeared in this order:</p>
        <ol aria-label="The list shown" className="flex flex-wrap justify-center gap-2">
          {studied.map((word, i) => (
            <WordWithIndex key={word} word={word} index={i} />
          ))}
        </ol>
      </div>
    );
  }
  if (response.format !== 'multi-select')
    throw new Error('Word Recall uses multi-select or ordering');
  return (
    <MultiSelectBoard
      response={response}
      label={kind === 'similar' ? 'Words, some from the same themes' : 'Words'}
      columns={board.length > 12 ? 4 : 3}
      size="sm"
      respond={respond}
      answer={answer}
      cells={board.map((word) => ({
        key: word,
        label: word,
        content: <span className="px-0.5 text-xs break-all text-ink sm:text-sm">{word}</span>,
      }))}
    />
  );
}
