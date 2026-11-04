import { useEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { AssessmentResult, CognitiveBand, CognitiveScore } from '@/domain/assessment';
import { COGNITIVE_AREAS } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AREAS } from '@/features/shared/areas';
import { useFormat, useText } from '@/i18n';
import { AssessmentDisclaimer } from './AssessmentDisclaimer';

const BAND_LABEL: Record<CognitiveBand, string> = {
  developing: 'result.bands.developing',
  solid: 'result.bands.solid',
  strong: 'result.bands.strong',
  exceptional: 'result.bands.exceptional',
};

export function AssessmentResultView({
  result,
  onRestart,
}: {
  result: AssessmentResult;
  onRestart: () => void;
}) {
  const { t } = useTranslation('assessment');
  const tx = useText();
  const format = useFormat();
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
          {t('result.eyebrow')}
        </p>
        <h1
          id="profile-title"
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 text-3xl font-semibold text-white outline-none"
        >
          {t('result.index')} <span className="font-mono">{profile.overall.value}</span>
          <span className="text-slate-400">/100</span>
        </h1>
        <p className="mt-1 text-slate-300">
          {t('result.summary', {
            band: t(BAND_LABEL[profile.overall.band]),
            margin: profile.overall.margin,
            answered: profile.overall.sampleSize,
            count: profile.overall.items,
            duration: format.ms(result.endedAt - result.startedAt),
          })}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          {t('result.caveat', { count: profile.overall.items })}
        </p>
      </header>

      <section aria-labelledby="areas-title">
        <h2 id="areas-title" className="mb-3 text-lg font-semibold text-white">
          {t('result.byArea')}
        </h2>
        <table className="w-full text-sm">
          <caption className="sr-only">{t('result.caption')}</caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">{t('result.columns.area')}</th>
              <th scope="col">{t('result.columns.score')}</th>
              <th scope="col">{t('result.columns.band')}</th>
              <th scope="col">{t('result.columns.evidence')}</th>
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
                    {tx(meta.label)}
                  </th>
                  <td className="py-3">
                    {score === null ? (
                      <span className="text-slate-500">{t('result.notMeasured')}</span>
                    ) : score.sampleSize === 0 ? (
                      <span className="text-amber-300">{t('result.skipped')}</span>
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
                    {score ? t(BAND_LABEL[score.band]) : '—'}
                  </td>
                  <td className="hidden w-40 py-3 pl-4 text-xs text-slate-400 sm:table-cell">
                    {score
                      ? t('result.evidence', {
                          margin: score.margin,
                          answered: score.sampleSize,
                          items: score.items,
                        })
                      : ''}
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
          {t('result.next.title')}
        </h2>
        {strongest && weakest && strongest !== weakest && (
          <p className="mt-1 text-slate-300">
            <Trans
              t={t}
              i18nKey="result.next.areas"
              values={{ strongest: tx(AREAS[strongest].label), weakest: tx(AREAS[weakest].label) }}
              components={{ strong: <strong /> }}
            />
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {weakest && weakestGame && strongest !== weakest && (
            <ButtonLink to={`/games/${weakestGame}`}>
              {t('result.next.train', {
                game: tx(getModule(weakestGame)?.definition.name ?? AREAS[weakest].label),
              })}
            </ButtonLink>
          )}
          <ButtonLink to="/games" variant={strongest !== weakest ? 'secondary' : 'primary'}>
            {t('result.next.browse')}
          </ButtonLink>
          <Button variant="secondary" onClick={onRestart}>
            {t('result.next.retake')}
          </Button>
        </div>
      </section>

      <AssessmentDisclaimer />
    </article>
  );
}
