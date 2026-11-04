import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CheckButton } from './CheckButton';
import type { ExerciseViewProps } from './types';

/** The template as code, each [[blank]] an accessible select. */
export function CodeCompletionView({
  exercise,
  locked,
  showSolution,
  onSubmit,
}: ExerciseViewProps<'code-completion'>) {
  const { t } = useTranslation('learn');
  const [values, setValues] = useState<Record<string, string>>({});
  const complete = exercise.blanks.every((b) => values[b.id] !== undefined);
  let blankNumber = 0;
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-sm leading-8">
        {exercise.template.split('\n').map((line, i) => (
          <div key={i} className="whitespace-pre">
            {line.split(/(\[\[[a-z0-9-]+\]\])/g).map((part, j) => {
              const match = /^\[\[([a-z0-9-]+)\]\]$/.exec(part);
              const blank = match ? exercise.blanks.find((b) => b.id === match[1]) : undefined;
              if (!blank) return <span key={j}>{part}</span>;
              blankNumber++;
              const chosen = values[blank.id];
              const right = showSolution && chosen !== blank.correct;
              return (
                <span key={j} className="inline-flex items-center gap-1">
                  <select
                    aria-label={t('exercise.blank', { number: blankNumber })}
                    value={chosen ?? ''}
                    disabled={locked}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [blank.id]: e.target.value }));
                    }}
                    className="rounded border border-sky-400/50 bg-slate-900 px-1 text-sky-200 focus-visible:outline-2 focus-visible:outline-sky-400"
                  >
                    <option value="" disabled>
                      ___
                    </option>
                    {blank.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {right && <span className="text-xs text-emerald-300">→ {blank.correct}</span>}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {!locked && (
        <CheckButton
          disabled={!complete}
          onClick={() => {
            onSubmit({ kind: 'code-completion', blanks: values });
          }}
        />
      )}
    </div>
  );
}
