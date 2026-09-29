import { useEffect, useRef } from 'react';
import type { AssessmentResult, CognitiveBand, CognitiveScore } from '@/domain/assessment';
import { COGNITIVE_AREAS } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AREAS } from '@/features/shared/areas';
import { formatMs } from '@/features/shared/format';
import { AssessmentDisclaimer } from './AssessmentDisclaimer';

const BAND_LABEL: Record<CognitiveBand, string> = {
  developing: 'Developing',
  solid: 'Solid',
  strong: 'Strong',
  exceptional: 'Exceptional',
};

export function AssessmentResultView({
  result,
  onRestart,
}: {
  result: AssessmentResult;
  onRestart: () => void;
}) {
  const { getModule } = useServices();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { profile } = result;
  const measured = COGNITIVE_AREAS.filter((area) => profile[area] !== null);
  const weakest = [...measured].sort(
    (a, b) => (profile[a] as CognitiveScore).value - (profile[b] as CognitiveScore).value,
  )[0];
  const strongest = [...measured].sort(
    (a, b) => (profile[b] as CognitiveScore).value - (profile[a] as CognitiveScore).value,
  )[0];
  const weakestGame = weakest
    ? result.steps.find((s) => s.step.area === weakest)?.step.gameId
    : undefined;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <article aria-labelledby="profile-title" className="flex flex-col gap-8">
      <header>
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Performance Profile
        </p>
        <h1
          id="profile-title"
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 text-3xl font-semibold text-white outline-none"
        >
          Programming Cognitive Index: <span className="font-mono">{profile.overall.value}</span>
          <span className="text-slate-400">/100</span>
        </h1>
        <p className="mt-1 text-slate-300">
          {BAND_LABEL[profile.overall.band]} overall · {profile.overall.sampleSize} challenges
          answered · {formatMs(result.endedAt - result.startedAt)}
        </p>
      </header>

      <section aria-labelledby="areas-title">
        <h2 id="areas-title" className="mb-3 text-lg font-semibold text-white">
          By area
        </h2>
        <table className="w-full text-sm">
          <caption className="sr-only">Cognitive score per area, 0 to 100</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Area</th>
              <th scope="col">Score</th>
              <th scope="col">Band</th>
            </tr>
          </thead>
          <tbody>
            {COGNITIVE_AREAS.map((area) => {
              const score = profile[area];
              const meta = AREAS[area];
              return (
                <tr key={area} className="border-b border-slate-800 last:border-0">
                  <th scope="row" className={`w-32 py-3 text-left font-semibold ${meta.accent}`}>
                    <span aria-hidden="true">{meta.glyph} </span>
                    {meta.label}
                  </th>
                  <td className="py-3">
                    {score === null ? (
                      <span className="text-slate-500">Not measured</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div
                          className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
                          aria-hidden="true"
                        >
                          <div
                            className="h-full rounded-full bg-sky-400"
                            style={{ width: `${score.value}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono tabular-nums text-white">
                          {score.value}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="w-32 py-3 pl-4 text-slate-300">
                    {score ? BAND_LABEL[score.band] : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {strongest && weakest && strongest !== weakest && (
        <section
          aria-labelledby="next-title"
          className="rounded-xl border border-sky-400/30 bg-sky-400/5 p-5 text-sm"
        >
          <h2 id="next-title" className="font-semibold text-sky-200">
            What to train next
          </h2>
          <p className="mt-1 text-slate-300">
            Your strongest area was <strong>{AREAS[strongest].label}</strong>. The biggest
            opportunity is <strong>{AREAS[weakest].label}</strong>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {weakestGame && (
              <ButtonLink to={`/games/${weakestGame}`}>
                Train {getModule(weakestGame)?.definition.name ?? AREAS[weakest].label}
              </ButtonLink>
            )}
            <Button variant="secondary" onClick={onRestart}>
              Retake assessment
            </Button>
          </div>
        </section>
      )}

      <AssessmentDisclaimer />
    </article>
  );
}
