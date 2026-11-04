import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { pathById } from '@/content/paths';
import { usePreferences } from '@/app/providers/preferencesContext';
import { dailyPool } from '@/features/shared/catalog';
import { useText } from '@/i18n';

/** One short, shared challenge per day: a habit that takes three minutes. */
export function DailyPage() {
  const { modules, getModule, clock, progress: progressRepository } = useServices();
  const navigate = useNavigate();
  const { state: games } = useProgress(progressRepository);
  const { state: profile, update } = useProfile();
  const [today] = useState(() => dayKeyOf(clock.now()));
  const { preferences } = usePreferences();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const { t } = useTranslation('home');
  const tx = useText();

  if (games.status === 'loading' || profile.status === 'loading') return <PageLoading />;
  if (games.status === 'error' || profile.status === 'error')
    return (
      <p role="alert" className="text-rose-300">
        {t('daily.loadError')}
      </p>
    );

  const daily = dailyChallenge(
    today,
    dailyPool(modules, pathById(preferences.path)),
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
        eyebrow={t('daily.eyebrow')}
        title={tx(module.definition.name)}
        description={t('daily.description')}
      />
      <Card className="flex max-w-2xl flex-col gap-4">
        <p className={`text-xs font-semibold tracking-widest uppercase ${meta.accent}`}>
          <span aria-hidden="true">{meta.glyph} </span>
          {t('daily.areaLevel', { area: tx(meta.label), level: daily.level })}
        </p>
        <p className="text-slate-300">{tx(module.definition.description)}</p>
        {done ? (
          <>
            <p role="status" className="text-emerald-200">
              {t('daily.done', { performance: done.performanceIndex })}
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink to="/">{t('daily.back')}</ButtonLink>
              <Button
                variant="secondary"
                onClick={() => {
                  setChallenge(daily);
                }}
              >
                {t('daily.again')}
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
              {t('daily.start')}
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
