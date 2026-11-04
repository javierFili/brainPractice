import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { msg, type Text } from '@/domain/shared';
import type { AssessmentSummary } from '@/domain/progress';
import { COGNITIVE_AREAS } from '@/domain/shared';
import { protocolById } from '@/games/assessment';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { AREAS } from '@/features/shared/areas';
import { LoadError } from '@/features/shared/LoadError';
import { PageLoading } from '@/features/shared/PageLoading';
import { useAppData } from '@/features/shared/useAppData';
import { useFormat, useText } from '@/i18n';
import { AssessmentDisclaimer } from './AssessmentDisclaimer';

const protocolName = (id: string): Text =>
  protocolById(id)?.name ?? msg('assessment:history.earlierProtocol');

function Empty() {
  const { t } = useTranslation('assessment');
  return (
    <div className="rounded-2xl border border-dashed border-line p-6 text-ink-soft">
      <p>{t('history.empty')}</p>
      <ButtonLink to="/assessment" className="mt-4">
        {t('history.take')}
      </ButtonLink>
    </div>
  );
}

function useAssessments(): AssessmentSummary[] | 'loading' | { error: () => void } {
  const data = useAppData();
  if (data.status === 'loading') return 'loading';
  if (data.status === 'error') return { error: data.reload };
  return [...(data.progress.assessments ?? [])];
}

/** Past runs, each compared only with the previous run of the same protocol. */
export function AssessmentHistoryPage() {
  const { t } = useTranslation('assessment');
  const tx = useText();
  const format = useFormat();
  const list = useAssessments();
  return (
    <>
      <PageHeader
        eyebrow={t('page.eyebrow')}
        title={t('history.title')}
        description={t('history.description')}
      />
      {list === 'loading' ? (
        <PageLoading />
      ) : !Array.isArray(list) ? (
        <LoadError onRetry={list.error} />
      ) : list.length === 0 ? (
        <Empty />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((a, i) => {
            const previous = list.slice(i + 1).find((p) => p.assessmentId === a.assessmentId);
            const delta = previous ? a.overall - previous.overall : null;
            return (
              <li
                key={`${a.assessmentId}-${a.endedAt}`}
                className="rounded-2xl border border-line bg-surface p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-ink">
                    {tx(protocolName(a.assessmentId))} · {format.date(a.endedAt)}
                  </p>
                  <p className="font-mono text-ink">
                    {a.overall}/100
                    {delta !== null && (
                      <span className="ml-2 text-sm text-ink-muted">
                        {delta === 0
                          ? t('history.same')
                          : t('history.delta', { delta: `${delta > 0 ? '+' : ''}${delta}` })}
                      </span>
                    )}
                  </p>
                </div>
                <ul className="mt-2 flex flex-wrap gap-3 text-sm text-ink-soft">
                  {COGNITIVE_AREAS.filter((area) => a.areas[area] !== undefined).map((area) => (
                    <li key={area}>
                      <span className={AREAS[area].accent}>{tx(AREAS[area].label)}</span>{' '}
                      {a.areas[area]}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** The latest profile per area, with the area to keep practising named respectfully. */
export function AssessmentProfilePage() {
  const { t } = useTranslation('assessment');
  const list = useAssessments();
  return (
    <>
      <PageHeader
        eyebrow={t('page.eyebrow')}
        title={t('profilePage.title')}
        description={t('profilePage.description')}
      />
      {list === 'loading' ? (
        <PageLoading />
      ) : !Array.isArray(list) ? (
        <LoadError onRetry={list.error} />
      ) : list.length === 0 || !list[0] ? (
        <Empty />
      ) : (
        <Profile latest={list[0]} />
      )}
    </>
  );
}

function Profile({ latest }: { latest: AssessmentSummary }) {
  const { t } = useTranslation('assessment');
  const tx = useText();
  const format = useFormat();
  const areas = COGNITIVE_AREAS.filter((area) => latest.areas[area] !== undefined);
  const lowest = [...areas].sort((x, y) => (latest.areas[x] ?? 0) - (latest.areas[y] ?? 0))[0];
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm text-ink-muted">
          {tx(protocolName(latest.assessmentId))} · {format.date(latest.endedAt)} ·{' '}
          {t('profilePage.index', { value: latest.overall })}
        </p>
        <ul className="flex flex-col gap-3">
          {areas.map((area) => {
            const value = latest.areas[area] ?? 0;
            return (
              <li key={area} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
                <span className={AREAS[area].accent}>{tx(AREAS[area].label)}</span>
                <span className="h-3 overflow-hidden rounded-full bg-raised" aria-hidden="true">
                  <span
                    className="block h-full rounded-full bg-brand"
                    style={{ width: `${value}%` }}
                  />
                </span>
                <span className="text-right font-mono text-ink">{value}</span>
              </li>
            );
          })}
        </ul>
        {lowest && (
          <p className="text-sm text-ink-soft">
            {t('profilePage.keepPractising')}{' '}
            <strong className="text-ink">{tx(AREAS[lowest].label)}</strong>.{' '}
            <Link to={`/train/${lowest}`} className="text-brand underline">
              {t('profilePage.seeGames')}
            </Link>
          </p>
        )}
      </section>
      <AssessmentDisclaimer />
    </div>
  );
}
