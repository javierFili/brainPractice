import { useState } from 'react';
import { COGNITIVE_AREAS } from '@/domain/shared';
import { PROGRAMMING_ASSESSMENT } from '@/games/assessment';
import { useServices } from '@/app/providers/servicesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { AREAS } from '@/features/shared/areas';
import { AssessmentDisclaimer } from './AssessmentDisclaimer';
import { AssessmentFlow } from './AssessmentFlow';

export function AssessmentPage() {
  const { getModule } = useServices();
  const [attempt, setAttempt] = useState(0);
  const definition = PROGRAMMING_ASSESSMENT;
  const missing = definition.sections.filter((s) => !getModule(s.gameId));
  const total = definition.sections.reduce(
    (sum, s) => sum + s.levels.length * s.challengesPerLevel,
    0,
  );

  if (attempt > 0) {
    return (
      <AssessmentFlow
        key={attempt}
        definition={definition}
        onRestart={() => {
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title={definition.name}
        description="A single run across all five areas that produces your Performance Profile and Programming Cognitive Index."
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="structure-title" className="flex flex-col gap-4">
          <h2 id="structure-title" className="text-lg font-semibold text-white">
            How it works
          </h2>
          <ol className="grid gap-2 sm:grid-cols-2">
            {definition.sections.map((section, i) => {
              const meta = AREAS[section.area];
              return (
                <li
                  key={section.area}
                  className={`rounded-lg border ${meta.ring} ${meta.soft} p-3 text-sm`}
                >
                  <span className="font-mono text-xs text-slate-400">{i + 1}.</span>{' '}
                  <span className={`font-semibold ${meta.accent}`}>{meta.label}</span>
                  <span className="text-slate-300">
                    {' '}
                    · {getModule(section.gameId)?.definition.name ?? section.gameId} · levels{' '}
                    {section.levels.join(', ')}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-sm text-slate-400">
            {total} challenges in total ({COGNITIVE_AREAS.length} areas × 3 difficulty levels × 2).
            Plan for about 25–40 minutes. Harder levels weigh more in your score. Assessment rounds
            do not count toward level records.
          </p>
          {missing.length > 0 ? (
            <p role="alert" className="text-sm text-rose-300">
              Not available: missing games {missing.map((s) => s.gameId).join(', ')}.
            </p>
          ) : (
            <div>
              <Button
                onClick={() => {
                  setAttempt(1);
                }}
              >
                Start assessment
              </Button>
            </div>
          )}
        </section>
        <AssessmentDisclaimer />
      </div>
    </>
  );
}
