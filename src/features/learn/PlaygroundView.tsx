import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { textId, type Text } from '@/domain/shared';
import { useText } from '@/i18n';
import type { Playground, PlaygroundInput } from '@/domain/learning';
import { playgroundInitial } from '@/domain/learning';
import { execute, literal, type Value } from '@/domain/pseudocode';
import { CodeBlock } from '@/components/code/CodeBlock';
import { InlineText } from './RichBlocks';

function InputControl({
  input,
  value,
  onChange,
}: {
  input: PlaygroundInput;
  value: Value;
  onChange: (value: Value) => void;
}) {
  const { t } = useTranslation('learn');
  const id = useId();
  const label = (
    <label htmlFor={id} className="font-mono text-sm text-slate-200">
      {input.name} =
    </label>
  );
  switch (input.type) {
    case 'number':
      return (
        <div className="flex flex-wrap items-center gap-3">
          {label}
          <input
            id={id}
            type="number"
            min={input.min}
            max={input.max}
            step={input.step ?? 1}
            value={typeof value === 'number' ? value : input.initial}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next)) onChange(Math.min(input.max, Math.max(input.min, next)));
            }}
            className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-white focus-visible:border-sky-400 focus-visible:outline-none"
          />
          <input
            type="range"
            aria-label={t('playground.slider', { name: input.name })}
            min={input.min}
            max={input.max}
            step={input.step ?? 1}
            value={typeof value === 'number' ? value : input.initial}
            onChange={(e) => {
              onChange(Number(e.target.value));
            }}
            className="w-40 accent-sky-400"
          />
        </div>
      );
    case 'boolean':
      return (
        <div className="flex items-center gap-3">
          {label}
          <select
            id={id}
            value={value === true ? 'true' : 'false'}
            onChange={(e) => {
              onChange(e.target.value === 'true');
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-white"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>
      );
    case 'text':
      return (
        <div className="flex items-center gap-3">
          {label}
          {input.options ? (
            <select
              id={id}
              value={typeof value === 'string' ? value : input.initial}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-white"
            >
              {input.options.map((option) => (
                <option key={option} value={option}>
                  &quot;{option}&quot;
                </option>
              ))}
            </select>
          ) : (
            <input
              id={id}
              value={typeof value === 'string' ? value : input.initial}
              maxLength={40}
              onChange={(e) => {
                onChange(e.target.value.replace(/"/g, ''));
              }}
              className="w-40 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-white"
            />
          )}
        </div>
      );
  }
}

/**
 * Interactive example: the learner changes the inputs of a fixed program and the interpreter
 * reruns it. Shows output, variables, the lines that ran and a step-by-step replay.
 */
export function PlaygroundView({ playground, intro }: { playground: Playground; intro: Text }) {
  const { t } = useTranslation(['learn', 'lessons']);
  const tx = useText();
  const [inputs, setInputs] = useState<Record<string, Value>>(() => ({
    ...playgroundInitial(playground),
  }));
  const [step, setStep] = useState<number | null>(null);
  const run = useMemo(() => execute(playground.source, inputs), [playground.source, inputs]);
  const header = playground.inputs.map(
    (input) => `${input.name} = ${literal(inputs[input.name] ?? null)}`,
  );
  const offset = header.length;
  const source = [...header, ...playground.source.split('\n')].join('\n');

  if (!run.ok) return <p role="alert">{t('playground.loadError')}</p>;
  const { output, variables, trace, error } = run.value;
  const shown = step === null ? null : trace[step];
  const executed = new Set(trace.map((t) => t.line + offset));
  const watched = (playground.watch ?? Object.keys(shown?.variables ?? variables)).filter(
    (name) => (shown?.variables ?? variables)[name] !== undefined,
  );
  const visible = shown?.variables ?? variables;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-slate-300">
        <InlineText text={intro} />
      </p>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-3 rounded-lg border border-sky-400/30 bg-sky-400/5 p-3">
            <legend className="px-1 text-xs font-semibold tracking-widest text-sky-200 uppercase">
              {t('playground.changeValues')}
            </legend>
            {playground.inputs.map((input) => (
              <InputControl
                key={input.name}
                input={input}
                value={inputs[input.name] ?? null}
                onChange={(value) => {
                  setStep(null);
                  setInputs((current) => ({ ...current, [input.name]: value }));
                }}
              />
            ))}
          </fieldset>
          <CodeBlock
            source={source}
            highlight={Array.from({ length: offset }, (_, i) => i + 1)}
            executed={executed}
            current={shown ? shown.line + offset : null}
            label={t('playground.program')}
            caption={t('playground.caption')}
          />
        </div>
        <aside className="flex flex-col gap-4" aria-label={t('playground.results')}>
          <section>
            <h3 className="mb-1 text-xs font-semibold tracking-widest text-slate-400 uppercase">
              {t('playground.output')}
            </h3>
            <pre
              aria-live="polite"
              className="min-h-10 rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-sm whitespace-pre-wrap text-emerald-200"
            >
              {output.length === 0 ? (
                <span className="text-slate-600">{t('playground.nothingPrinted')}</span>
              ) : (
                output.join('\n')
              )}
            </pre>
            {error && (
              <p role="alert" className="mt-2 text-sm text-rose-300">
                {t('playground.errorLine', {
                  line: error.line + offset,
                  message: tx(error.message),
                })}
              </p>
            )}
          </section>
          <section>
            <h3 className="mb-1 text-xs font-semibold tracking-widest text-slate-400 uppercase">
              {shown
                ? t('playground.variablesAfter', { line: shown.line + offset })
                : t('playground.variablesEnd')}
            </h3>
            <table className="w-full font-mono text-sm">
              <tbody>
                {watched.map((name) => (
                  <tr key={name} className="border-b border-slate-800 last:border-0">
                    <th scope="row" className="py-1 pr-3 text-left font-normal text-slate-400">
                      {name}
                    </th>
                    <td className="py-1 text-white">{literal(visible[name] ?? null)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {trace.length > 1 && (
            <section>
              <h3 className="mb-1 text-xs font-semibold tracking-widest text-slate-400 uppercase">
                {t('playground.stepThrough')}
              </h3>
              <input
                type="range"
                min={0}
                max={trace.length}
                value={step === null ? trace.length : step}
                aria-label={t('playground.stepLabel')}
                aria-valuetext={
                  step === null
                    ? t('playground.endOfProgram')
                    : t('playground.stepOf', { number: step + 1, total: trace.length })
                }
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setStep(value >= trace.length ? null : value);
                }}
                className="w-full accent-sky-400"
              />
              <p className="text-xs text-slate-400">
                {step === null
                  ? t('playground.endSteps', { count: trace.length })
                  : t('playground.stepOf', { number: step + 1, total: trace.length })}
              </p>
            </section>
          )}
        </aside>
      </div>
      <section
        aria-labelledby="try-title"
        className="rounded-lg border border-slate-800 p-3 text-sm"
      >
        <h3 id="try-title" className="mb-1 font-semibold text-white">
          {t('playground.tryThis')}
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-slate-300">
          {playground.prompts.map((prompt) => (
            <li key={textId(prompt)}>
              <InlineText text={prompt} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
