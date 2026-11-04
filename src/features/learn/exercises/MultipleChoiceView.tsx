import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CodeBlock } from '@/components/code/CodeBlock';
import { InlineText } from '../RichBlocks';
import { CheckButton } from './CheckButton';
import type { ExerciseViewProps } from './types';

export function MultipleChoiceView({
  exercise,
  locked,
  showSolution,
  onSubmit,
}: ExerciseViewProps<'multiple-choice'>) {
  const { t } = useTranslation('learn');
  const [choice, setChoice] = useState<string | null>(null);
  const name = useId();
  return (
    <div className="flex flex-col gap-4">
      {exercise.code && (
        <CodeBlock source={exercise.code.source} highlight={exercise.code.highlight ?? []} />
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{t('exercise.options')}</legend>
        {exercise.options.map((option) => {
          const correct = showSolution && option.id === exercise.correctOptionId;
          const wrongPick = locked && option.id === choice && !correct && showSolution;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky-400 ${
                correct
                  ? 'border-emerald-400/70 bg-emerald-400/10'
                  : choice === option.id
                    ? 'border-sky-400/70 bg-sky-400/10'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-500'
              } ${locked ? 'cursor-default' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={choice === option.id}
                disabled={locked}
                onChange={() => {
                  setChoice(option.id);
                }}
                className="mt-1 accent-sky-400"
              />
              <span className="flex-1">
                <InlineText text={option.label} />
              </span>
              {correct && (
                <span className="text-xs font-semibold text-emerald-300">
                  ✓ {t('exercise.correctAnswer')}
                </span>
              )}
              {wrongPick && (
                <span className="text-xs font-semibold text-rose-300">
                  ✗ {t('exercise.yourAnswer')}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
      {!locked && (
        <CheckButton
          disabled={choice === null}
          onClick={() => {
            if (choice !== null) onSubmit({ kind: 'multiple-choice', optionId: choice });
          }}
        />
      )}
    </div>
  );
}
