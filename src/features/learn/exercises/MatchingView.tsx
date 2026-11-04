import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useText } from '@/i18n';
import { InlineText } from '../RichBlocks';
import { plainText } from '../text';
import { stableShuffle } from '../shuffle';
import { CheckButton } from './CheckButton';
import type { ExerciseViewProps } from './types';

export function MatchingView({
  exercise,
  locked,
  showSolution,
  onSubmit,
}: ExerciseViewProps<'matching'>) {
  const { t } = useTranslation('learn');
  const tx = useText();
  const [rights] = useState(() =>
    stableShuffle(
      exercise.pairs.map((p) => p.right),
      exercise.id,
    ),
  );
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const complete = exercise.pairs.every((p) => pairs[p.left.id] !== undefined);
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {exercise.pairs.map(({ left, right }) => {
          const wrong = showSolution && pairs[left.id] !== right.id;
          return (
            <li
              key={left.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            >
              <span id={`${exercise.id}-${left.id}`} className="min-w-24 font-mono text-sm">
                <InlineText text={left.label} />
              </span>
              <span aria-hidden="true" className="text-slate-500">
                →
              </span>
              <select
                aria-labelledby={`${exercise.id}-${left.id}`}
                value={pairs[left.id] ?? ''}
                disabled={locked}
                onChange={(e) => {
                  setPairs((p) => ({ ...p, [left.id]: e.target.value }));
                }}
                className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                <option value="" disabled>
                  {t('exercise.choose')}
                </option>
                {rights.map((option) => (
                  <option key={option.id} value={option.id}>
                    {plainText(tx(option.label))}
                  </option>
                ))}
              </select>
              {wrong && (
                <span className="text-xs text-emerald-300">
                  → <InlineText text={right.label} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {!locked && (
        <CheckButton
          disabled={!complete}
          onClick={() => {
            onSubmit({ kind: 'matching', pairs });
          }}
        />
      )}
    </div>
  );
}
