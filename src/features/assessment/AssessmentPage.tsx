import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ASSESSMENT_PROTOCOLS, type AssessmentProtocol } from '@/games/assessment';
import { useServices } from '@/app/providers/servicesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { AREAS } from '@/features/shared/areas';
import { useText } from '@/i18n';
import { AssessmentDisclaimer } from './AssessmentDisclaimer';
import { AssessmentFlow } from './AssessmentFlow';

const totalOf = ({ definition }: AssessmentProtocol) =>
  definition.sections.reduce((sum, s) => sum + s.levels.length * s.challengesPerLevel, 0);

export function AssessmentPage() {
  const { t } = useTranslation('assessment');
  const tx = useText();
  const { getModule } = useServices();
  const [attempt, setAttempt] = useState(0);
  const [chosen, setChosen] = useState<AssessmentProtocol>(
    ASSESSMENT_PROTOCOLS[0] as AssessmentProtocol,
  );
  const { definition } = chosen;
  const missing = definition.sections.filter((s) => !getModule(s.gameId));

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
        eyebrow={t('page.eyebrow')}
        title={t('page.title')}
        description={t('page.description')}
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <fieldset>
            <legend className="mb-3 text-lg font-semibold text-ink">
              {t('page.chooseLength')}
            </legend>
            <div
              role="radiogroup"
              aria-label={t('page.protocol')}
              className="grid gap-3 sm:grid-cols-3"
            >
              {ASSESSMENT_PROTOCOLS.map((protocol) => {
                const selected = protocol === chosen;
                return (
                  <button
                    key={protocol.definition.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setChosen(protocol);
                    }}
                    className={`flex flex-col gap-1 rounded-2xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-brand ${
                      selected
                        ? 'border-brand bg-brand/15'
                        : 'border-line bg-surface hover:bg-raised'
                    }`}
                  >
                    <span className="font-semibold text-ink">{tx(protocol.title)}</span>
                    <span className="text-sm text-ink-soft">{tx(protocol.summary)}</span>
                    <span className="mt-1 text-xs text-ink-muted">
                      {t('page.length', {
                        count: totalOf(protocol),
                        minutes: protocol.minutes,
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <section aria-labelledby="structure-title" className="flex flex-col gap-3">
            <h2 id="structure-title" className="text-lg font-semibold text-ink">
              {t('page.howItWorks')}
            </h2>
            <ol className="grid gap-2 sm:grid-cols-2">
              {definition.sections.map((section, i) => {
                const meta = AREAS[section.area];
                return (
                  <li
                    key={`${section.area}-${section.gameId}`}
                    className={`rounded-lg border ${meta.ring} ${meta.soft} p-3 text-sm`}
                  >
                    <span className="font-mono text-xs text-ink-muted">{i + 1}.</span>{' '}
                    <span className={`font-semibold ${meta.accent}`}>{tx(meta.label)}</span>
                    <span className="text-ink-soft">
                      {' '}
                      ·{' '}
                      {t('page.section', {
                        game: tx(getModule(section.gameId)?.definition.name ?? section.gameId),
                        levels: section.levels.join(', '),
                      })}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="text-sm text-ink-muted">{t('page.structureNote')}</p>
            {missing.length > 0 ? (
              <p role="alert" className="text-sm text-danger">
                {t('page.missing', { games: missing.map((s) => s.gameId).join(', ') })}
              </p>
            ) : (
              <div>
                <Button
                  onClick={() => {
                    setAttempt(1);
                  }}
                >
                  {tx(chosen.start)}
                </Button>
              </div>
            )}
          </section>
        </div>
        <AssessmentDisclaimer />
      </div>
    </>
  );
}
