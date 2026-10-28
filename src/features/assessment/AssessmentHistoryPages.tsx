import { Link } from 'react-router';
import type { AssessmentSummary } from '@/domain/progress';
import { COGNITIVE_AREAS } from '@/domain/shared';
import { protocolById } from '@/games/assessment';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { AREAS } from '@/features/shared/areas';
import { formatDate } from '@/features/shared/format';
import { LoadError } from '@/features/shared/LoadError';
import { PageLoading } from '@/features/shared/PageLoading';
import { useAppData } from '@/features/shared/useAppData';
import { AssessmentDisclaimer } from './AssessmentDisclaimer';

const protocolName = (id: string) => protocolById(id)?.definition.name ?? 'Earlier protocol';

function Empty() {
  return (
    <div className="rounded-2xl border border-dashed border-line p-6 text-ink-soft">
      <p>No assessment yet.</p>
      <ButtonLink to="/assessment" className="mt-4">
        Take the assessment
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
  const list = useAssessments();
  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Past results"
        description="Each run is compared only with your previous run of the same protocol."
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
                    {protocolName(a.assessmentId)} · {formatDate(a.endedAt)}
                  </p>
                  <p className="font-mono text-ink">
                    {a.overall}/100
                    {delta !== null && (
                      <span className="ml-2 text-sm text-ink-muted">
                        {delta === 0
                          ? 'same as last run'
                          : `${delta > 0 ? '+' : ''}${delta} vs. last run`}
                      </span>
                    )}
                  </p>
                </div>
                <ul className="mt-2 flex flex-wrap gap-3 text-sm text-ink-soft">
                  {COGNITIVE_AREAS.filter((area) => a.areas[area] !== undefined).map((area) => (
                    <li key={area}>
                      <span className={AREAS[area].accent}>{AREAS[area].label}</span>{' '}
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
  const list = useAssessments();
  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="My performance profile"
        description="Your most recent assessment, area by area. A recreational profile of these activities — not a measure of intelligence or health."
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
  const areas = COGNITIVE_AREAS.filter((area) => latest.areas[area] !== undefined);
  const lowest = [...areas].sort((x, y) => (latest.areas[x] ?? 0) - (latest.areas[y] ?? 0))[0];
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm text-ink-muted">
          {protocolName(latest.assessmentId)} · {formatDate(latest.endedAt)} · index{' '}
          {latest.overall}/100
        </p>
        <ul className="flex flex-col gap-3">
          {areas.map((area) => {
            const value = latest.areas[area] ?? 0;
            return (
              <li key={area} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
                <span className={AREAS[area].accent}>{AREAS[area].label}</span>
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
            An area you can keep practising:{' '}
            <strong className="text-ink">{AREAS[lowest].label}</strong>.{' '}
            <Link to={`/train/${lowest}`} className="text-brand underline">
              See its games
            </Link>
          </p>
        )}
      </section>
      <AssessmentDisclaimer />
    </div>
  );
}
