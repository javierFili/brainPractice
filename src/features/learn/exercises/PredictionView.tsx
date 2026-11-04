import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CodeBlock } from '@/components/code/CodeBlock';
import { CheckButton } from './CheckButton';
import type { ExerciseViewProps } from './types';

export function PredictionView({ exercise, locked, onSubmit }: ExerciseViewProps<'prediction'>) {
  const { t } = useTranslation('learn');
  const [value, setValue] = useState('');
  const id = useId();
  const output = exercise.target.kind === 'output';
  const submit = () => {
    if (value.trim() !== '') onSubmit({ kind: 'prediction', value });
  };
  return (
    <div className="flex flex-col gap-4">
      <CodeBlock source={exercise.code.source} highlight={exercise.code.highlight ?? []} />
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm text-slate-300">
          {output
            ? t('exercise.predictOutput')
            : t('exercise.predictValue', { name: exercise.target.name })}
        </label>
        {output ? (
          <textarea
            id={id}
            rows={3}
            value={value}
            disabled={locked}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-white focus-visible:border-sky-400 focus-visible:outline-none"
          />
        ) : (
          <input
            id={id}
            autoComplete="off"
            value={value}
            disabled={locked}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-lg text-white focus-visible:border-sky-400 focus-visible:outline-none"
          />
        )}
        <p className="text-xs text-slate-500">{t('exercise.quotes')}</p>
      </div>
      {!locked && <CheckButton disabled={value.trim() === ''} onClick={submit} />}
    </div>
  );
}
