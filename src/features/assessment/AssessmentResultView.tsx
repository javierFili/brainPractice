import { useEffect, useRef } from 'react';
import type { AssessmentResult, CognitiveBand, CognitiveScore } from '@/domain/assessment';
import { COGNITIVE_AREAS } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AREAS } from '@/features/shared/areas';
import { formatMs } from '@/features/shared/format';
import { AssessmentDisclaimer } from './AssessmentDisclaimer';

const BAND_LABEL: Record<CognitiveBand, string> = {
  developing: 'Room to practise',
  solid: 'Steady',
  strong: 'Strong',
  exceptional: 'Very strong',
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
          Performance index: <span className="font-mono">{profile.overall.value}</span>
          <span className="text-slate-400">/100</span>
        </h1>
        <p className="mt-1 text-slate-300">
          {BAND_LABEL[profile.overall.band]} overall · ±{profile.overall.margin} points ·{' '}
          {profile.overall.sampleSize} of {profile.overall.items} challenges answered ·{' '}
          {formatMs(result.endedAt - result.startedAt)}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          With {profile.overall.items} challenges the margin is wide: read these numbers as a rough
          starting point for choosing what to train, not as a precise measurement. Skipped
          challenges count as unsolved. This is an internal index of this platform — not an IQ
          score, not a clinical measure, and not compared with any population.
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
              <th scope="col">Evidence</th>
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
                    ) : score.sampleSize === 0 ? (
                      <span className="text-amber-300">Skipped — counts as 0</span>
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
                  <td className="w-28 py-3 pl-4 text-slate-300">
                    {score ? BAND_LABEL[score.band] : '—'}
                  </td>
                  <td className="hidden w-40 py-3 pl-4 text-xs text-slate-400 sm:table-cell">
                    {score ? `±${score.margin} · ${score.sampleSize}/${score.items} answered` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section
        aria-labelledby="next-title"
        className="rounded-xl border border-sky-400/30 bg-sky-400/5 p-5 text-sm"
      >
        <h2 id="next-title" className="font-semibold text-sky-200">
          What to train next
        </h2>
        {strongest && weakest && strongest !== weakest && (
          <p className="mt-1 text-slate-300">
            Your strongest area was <strong>{AREAS[strongest].label}</strong>. The biggest
            opportunity is <strong>{AREAS[weakest].label}</strong>.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {weakest && weakestGame && strongest !== weakest && (
            <ButtonLink to={`/games/${weakestGame}`}>
              Train {getModule(weakestGame)?.definition.name ?? AREAS[weakest].label}
            </ButtonLink>
          )}
          <ButtonLink to="/games" variant={strongest !== weakest ? 'secondary' : 'primary'}>
            Browse games
          </ButtonLink>
          <Button variant="secondary" onClick={onRestart}>
            Retake assessment
          </Button>
        </div>
      </section>

      <AssessmentDisclaimer />
    </article>
  );
}
