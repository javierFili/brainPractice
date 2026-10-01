import { Link } from 'react-router';
import {
  cognitiveProfile,
  dailyChallenge,
  recommend,
  type Recommendation,
} from '@/domain/insights';
import { courseProgress, lessonsOf, lessonStatus, type LearningProgress } from '@/domain/learning';
import { weekSummary, type UserProfile } from '@/domain/profile';
import type { UserProgress } from '@/domain/progress';
import type { CognitiveArea } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AREAS } from '@/features/shared/areas';
import { dayKeyOf } from '@/features/shared/days';
import { formatPercent } from '@/features/shared/format';
import { WeekStrip } from './WeekStrip';

const KIND_LABEL: Readonly<Record<Recommendation['kind'], string>> = {
  review: 'Review',
  lesson: 'Learn',
  daily: 'Daily',
  train: 'Train',
  assessment: 'Assess',
};

/** "Your mind": what you have done, where you stand, and what to do next — with reasons. */
export function Dashboard({
  games,
  learning,
  profile,
}: {
  games: UserProgress;
  learning: LearningProgress;
  profile: UserProfile;
}) {
  const { course, modules, getModule, clock } = useServices();
  const now = clock.now();
  const today = dayKeyOf(now);
  const gameOfArea: Partial<Record<CognitiveArea, string>> = Object.fromEntries(
    modules.map((m) => [m.definition.area, m.definition.id as string]),
  );
  const daily = dailyChallenge(
    today,
    modules.map((m) => m.definition.id),
    games.games,
  );
  const items = recommend({
    course,
    learning,
    games,
    profile,
    now,
    today,
    daily,
    gameOfArea,
    gameName: (id) => getModule(id)?.definition.name ?? id,
  });
  const standings = cognitiveProfile(games, gameOfArea);
  const learn = courseProgress(course, learning);
  const lessons = lessonsOf(course);
  const latestAssessment = games.assessments?.[0];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <p className="font-mono text-sm text-sky-300">// your mind</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Welcome back
        </h1>
        <WeekStrip week={weekSummary(profile, today)} />
      </header>

      <section aria-labelledby="today-title" className="flex flex-col gap-3">
        <h2 id="today-title" className="text-lg font-semibold text-white">
          Today
        </h2>
        <ol className="grid gap-3 md:grid-cols-2">
          {items.map((item, i) => (
            <li key={item.kind}>
              <Link
                to={item.href}
                className={`flex h-full flex-col gap-2 rounded-xl border p-4 transition-colors hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  i === 0 ? 'border-sky-400/50 bg-sky-400/5' : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <span className="flex items-center justify-between text-xs">
                  <span className="font-semibold tracking-widest text-slate-400 uppercase">
                    {KIND_LABEL[item.kind]}
                  </span>
                  <span className="font-mono text-slate-500">≈ {item.minutes} min</span>
                </span>
                <span className="font-semibold text-white">{item.title}</span>
                <span className="text-sm text-slate-400">{item.reason}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-white">Learn · {course.title}</h2>
            <span className="font-mono text-sm text-slate-300">{formatPercent(learn.ratio)}</span>
          </div>
          <ProgressBar
            value={learn.completedLessons}
            max={learn.totalLessons}
            label="Programming Logic progress"
            tone="bg-violet-400"
          />
          <p className="text-xs text-slate-400">
            {learn.completedLessons} / {learn.totalLessons} lessons · {learn.masteredConcepts} /{' '}
            {learn.totalConcepts} concepts mastered
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {lessons.map((lesson) => {
              const status = lessonStatus(course, learning, lesson.id);
              return (
                <li
                  key={lesson.id}
                  className={status === 'locked' ? 'text-slate-500' : 'text-slate-200'}
                >
                  <span aria-hidden="true" className="inline-block w-5">
                    {status === 'completed' ? '✓' : status === 'available' ? '→' : '🔒'}
                  </span>
                  {lesson.title}
                  <span className="sr-only">, {status}</span>
                </li>
              );
            })}
          </ul>
          <ButtonLink to="/learn" variant="secondary" className="mt-auto self-start">
            Open the learning path
          </ButtonLink>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-white">Train</h2>
          <ul className="flex flex-col gap-2">
            {standings.map((standing) => {
              const meta = AREAS[standing.area];
              return (
                <li key={standing.area}>
                  <Link
                    to={standing.gameId ? `/games/${standing.gameId}` : '/games'}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-sky-400"
                  >
                    <span className={meta.accent}>
                      <span aria-hidden="true">{meta.glyph} </span>
                      {meta.label}
                    </span>
                    <span className="font-mono text-slate-300">
                      {standing.clearedLevel === 0
                        ? 'not started'
                        : `level ${standing.clearedLevel} cleared`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <ButtonLink to="/games" variant="secondary" className="mt-auto self-start">
            All games
          </ButtonLink>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-white">Performance profile</h2>
          <dl className="flex flex-col gap-2">
            {standings.map((standing) => {
              const value = latestAssessment?.areas[standing.area] ?? standing.recentPerformance;
              const meta = AREAS[standing.area];
              return (
                <div
                  key={standing.area}
                  className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2 text-sm"
                >
                  <dt className="text-slate-300">{meta.label}</dt>
                  <dd className="h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-sky-400"
                      style={{ width: `${value ?? 0}%` }}
                    />
                  </dd>
                  <dd className="text-right font-mono text-slate-300 tabular-nums">
                    {value ?? '—'}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="text-xs text-slate-500">
            {latestAssessment
              ? 'From your latest assessment.'
              : 'Recent performance on each game (0–100). Take the assessment for a baseline.'}{' '}
            Describes performance on these exercises only — not intelligence.
          </p>
        </Card>
      </div>
    </div>
  );
}
