import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DAILY_CHALLENGE_COUNT, dailyChallenge, type DailyChallenge } from '@/domain/insights';
import { recordDaily } from '@/domain/profile';
import { useServices } from '@/app/providers/servicesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PlaySession } from '@/features/play/PlaySession';
import { AREAS } from '@/features/shared/areas';
import { dayKeyOf } from '@/features/shared/days';
import { PageLoading } from '@/features/shared/PageLoading';
import { useProfile } from '@/features/shared/useProfile';
import { useProgress } from '@/features/shared/useProgress';

/** One short, shared challenge per day: a habit that takes three minutes. */
export function DailyPage() {
  const { modules, getModule, clock, progress: progressRepository } = useServices();
  const navigate = useNavigate();
  const { state: games } = useProgress(progressRepository);
  const { state: profile, update } = useProfile();
  const [today] = useState(() => dayKeyOf(clock.now()));
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);

  if (games.status === 'loading' || profile.status === 'loading') return <PageLoading />;
  if (games.status === 'error' || profile.status === 'error')
    return (
      <p role="alert" className="text-rose-300">
        Your progress could not be loaded.
      </p>
    );

  const daily = dailyChallenge(
    today,
    modules.map((m) => m.definition.id),
    games.progress.games,
  );
  const module = getModule(daily.gameId);
  if (!module) return null;
  const done = profile.value.daily[today];

  if (challenge) {
    return (
      <PlaySession
        module={module}
        level={challenge.level}
        seed={challenge.seed}
        assisted={false}
        challengeCount={DAILY_CHALLENGE_COUNT}
        onResult={(result) => {
          if (!result.completed) return;
          void update((current) =>
            recordDaily(current, today, {
              gameId: challenge.gameId,
              level: challenge.level,
              seed: challenge.seed,
              performanceIndex: result.score.performanceIndex,
              completedAt: result.endedAt,
            }),
          ).catch((error: unknown) => {
            console.error('[daily] Could not save the daily challenge', error);
          });
        }}
        onRestart={({ level, seed }) => {
          void navigate(
            `/games/${module.definition.id}/play/${level}${seed === undefined ? '' : `?seed=${seed}`}`,
          );
        }}
      />
    );
  }

  const meta = AREAS[module.definition.area];
  return (
    <>
      <PageHeader
        eyebrow="Daily challenge"
        title={module.definition.name}
        description="A new challenge every day, the same for everyone. Five quick problems at your level — about three minutes."
      />
      <Card className="flex max-w-2xl flex-col gap-4">
        <p className={`text-xs font-semibold tracking-widest uppercase ${meta.accent}`}>
          <span aria-hidden="true">{meta.glyph} </span>
          {meta.label} · level {daily.level}
        </p>
        <p className="text-slate-300">{module.definition.description}</p>
        {done ? (
          <>
            <p role="status" className="text-emerald-200">
              ✓ Done for today — performance {done.performanceIndex}/100. A new challenge arrives
              tomorrow.
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink to="/">Back to your dashboard</ButtonLink>
              <Button
                variant="secondary"
                onClick={() => {
                  setChallenge(daily);
                }}
              >
                Play it again (not counted)
              </Button>
            </div>
          </>
        ) : (
          <div>
            <Button
              onClick={() => {
                setChallenge(daily);
              }}
            >
              Start today&apos;s challenge
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
