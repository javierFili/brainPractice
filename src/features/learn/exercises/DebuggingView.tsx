import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CodeBlock } from '@/components/code/CodeBlock';
import { InlineText } from '../RichBlocks';
import { CheckButton } from './CheckButton';
import type { ExerciseViewProps } from './types';

/** Two questions in one: where is the bug, and why is it a bug. */
export function DebuggingView({
  exercise,
  locked,
  showSolution,
  onSubmit,
}: ExerciseViewProps<'debugging'>) {
  const { t } = useTranslation('learn');
  const [line, setLine] = useState<number | null>(null);
  const [cause, setCause] = useState<string | null>(null);
  const name = useId();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-slate-300">{t('exercise.bugLine')}</p>
        <CodeBlock
          source={exercise.code.source}
          label={t('exercise.buggyCode')}
          selection={{
            selected: line,
            onSelect: setLine,
            disabled: locked,
            solution: showSolution ? exercise.bugLine : null,
          }}
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-slate-300">{t('exercise.why')}</legend>
        {exercise.causes.map((option) => {
          const correct = showSolution && option.id === exercise.correctCauseId;
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky-400 ${
                correct
                  ? 'border-emerald-400/70 bg-emerald-400/10'
                  : cause === option.id
                    ? 'border-sky-400/70 bg-sky-400/10'
                    : 'border-slate-700 bg-slate-900'
              }`}
            >
              <input
                type="radio"
                name={name}
                checked={cause === option.id}
                disabled={locked}
                onChange={() => {
                  setCause(option.id);
                }}
                className="mt-1 accent-sky-400"
              />
              <span className="flex-1">
                <InlineText text={option.label} />
              </span>
              {correct && (
                <span className="text-xs font-semibold text-emerald-300">
                  ✓ {t('exercise.reason')}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>
      {!locked && (
        <CheckButton
          disabled={line === null || cause === null}
          onClick={() => {
            if (line !== null && cause !== null)
              onSubmit({ kind: 'debugging', line, causeId: cause });
          }}
        />
      )}
    </div>
  );
}
