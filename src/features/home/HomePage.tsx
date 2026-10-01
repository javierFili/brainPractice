import { Link } from 'react-router';
import { emptyLearningProgress } from '@/domain/learning';
import { COGNITIVE_AREAS } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import { ButtonLink } from '@/components/ui/Button';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { AREAS } from '@/features/shared/areas';
import { PageLoading } from '@/features/shared/PageLoading';
import { useProfile } from '@/features/shared/useProfile';
import { useProgress } from '@/features/shared/useProgress';
import { useStored } from '@/features/shared/useStored';

const PILLARS = [
  {
    eyebrow: 'Learn',
    title: 'Programming logic from zero',
    text: 'Ten interactive lessons: values, decisions, loops, functions, algorithms and debugging — the thinking before any syntax.',
    to: '/learn',
  },
  {
    eyebrow: 'Train',
    title: 'Five cognitive skills, on code',
    text: 'Short exercises on tracing, remembering, scanning, spotting anomalies and finding patterns, levels 1–10.',
    to: '/games',
  },
  {
    eyebrow: 'Assess',
    title: 'See where you stand',
    text: 'A performance profile across the five areas, with honest margins. A practice tool, not a test of intelligence.',
    to: '/assessment',
  },
] as const;

function Landing() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6 pt-6 sm:pt-12">
        <p className="font-mono text-sm text-sky-300">
          // learn and practise the thinking behind code
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Learn to think like a programmer.
        </h1>
        <p className="max-w-2xl text-lg text-slate-400">
          Interactive lessons teach programming logic from scratch; short training exercises let you
          practise the reasoning, memory and attention that reading code takes. Track your progress
          as you go.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/start">Start with a 2-minute challenge</ButtonLink>
          <ButtonLink to="/learn" variant="secondary">
            Go straight to the lessons
          </ButtonLink>
        </div>
      </section>

      <section aria-labelledby="pillars-title">
        <h2
          id="pillars-title"
          className="mb-4 text-sm font-semibold tracking-widest text-slate-400 uppercase"
        >
          Three ways to use it
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <li key={pillar.eyebrow}>
              <Link
                to={pillar.to}
                className="flex h-full flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-600 focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                <span className="text-xs font-semibold tracking-widest text-sky-300 uppercase">
                  {pillar.eyebrow}
                </span>
                <span className="font-semibold text-white">{pillar.title}</span>
                <span className="text-sm text-slate-400">{pillar.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="areas-title">
        <h2
          id="areas-title"
          className="mb-4 text-sm font-semibold tracking-widest text-slate-400 uppercase"
        >
          Five cognitive areas
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {COGNITIVE_AREAS.map((area) => {
            const meta = AREAS[area];
            return (
              <li key={area} className={`rounded-xl border ${meta.ring} ${meta.soft} p-4`}>
                <p className={`font-mono text-2xl ${meta.accent}`} aria-hidden="true">
                  {meta.glyph}
                </p>
                <h3 className="mt-2 font-semibold text-white">{meta.label}</h3>
                <p className="mt-1 text-sm text-slate-400">{meta.summary}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/** New visitors see the landing; anyone with progress sees their dashboard. */
export function HomePage() {
  const { progress, learning } = useServices();
  const games = useProgress(progress).state;
  const learn = useStored(learning, emptyLearningProgress).state;
  const profile = useProfile().state;

  if (games.status === 'loading' || learn.status === 'loading' || profile.status === 'loading')
    return <PageLoading />;
  if (games.status !== 'ready' || learn.status !== 'ready' || profile.status !== 'ready')
    return <Landing />;
  const returning =
    profile.value.onboardedAt !== null ||
    games.progress.recentSessions.length > 0 ||
    Object.keys(learn.value.lessons).length > 0;
  return returning ? (
    <Dashboard games={games.progress} learning={learn.value} profile={profile.value} />
  ) : (
    <Landing />
  );
}
