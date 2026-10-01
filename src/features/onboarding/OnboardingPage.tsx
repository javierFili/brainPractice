import { useCourse } from '@/app/providers/useCourse';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { lessonsOf } from '@/domain/learning';
import { completeOnboarding, DEFAULT_WEEKLY_TARGET, type Goal } from '@/domain/profile';
import type { GameResult } from '@/domain/session';
import { useServices } from '@/app/providers/servicesContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PlaySession } from '@/features/play/PlaySession';
import { saveSessionResult } from '@/features/play/usePersistResult';
import { useProfile } from '@/features/shared/useProfile';

const WARM_UP = { gameId: 'algorithmic-logic', level: 1, challenges: 3 } as const;

const GOALS: readonly { goal: Goal; title: string; detail: string }[] = [
  {
    goal: 'learn',
    title: 'Learn programming logic',
    detail:
      'Start from zero: values, decisions, loops, functions and algorithms, one interactive lesson at a time.',
  },
  {
    goal: 'train',
    title: 'Train how I think about code',
    detail:
      'Short cognitive exercises on reading, tracing and reasoning about code, with levels 1–10.',
  },
  {
    goal: 'both',
    title: 'Both',
    detail: 'Lessons to learn the ideas, and training to practise the skills behind them.',
  },
];

type Step = 'welcome' | 'warm-up' | 'result' | 'goal';

/** First visit: a 2-minute taste of training, then the learner chooses their own goal. No account needed. */
export function OnboardingPage() {
  const { getModule, progress, clock } = useServices();
  const course = useCourse();
  const { update } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [warmUp, setWarmUp] = useState<GameResult | null>(null);
  const [goal, setGoal] = useState<Goal>('both');
  const [target, setTarget] = useState(DEFAULT_WEEKLY_TARGET);
  const targetId = useId();
  const module = getModule(WARM_UP.gameId);
  const firstLesson = lessonsOf(course)[0];

  const finish = async (chosen: Goal) => {
    await update((p) =>
      completeOnboarding(p, { goal: chosen, weeklyTarget: target, at: clock.now() }),
    ).catch((error: unknown) => {
      console.error('[onboarding] Could not save the profile', error);
    });
    void navigate(chosen === 'train' || !firstLesson ? '/games' : `/learn/${firstLesson.id}`);
  };

  if (step === 'warm-up' && module) {
    return (
      <PlaySession
        module={module}
        level={WARM_UP.level}
        seed={undefined}
        assisted={false}
        challengeCount={WARM_UP.challenges}
        onRestart={() => undefined}
        onResult={(result) => {
          void saveSessionResult(progress, result).catch((error: unknown) => {
            console.error('[onboarding] Could not save the warm-up', error);
          });
          setWarmUp(result);
          setStep('result');
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {step === 'welcome' && (
        <>
          <p className="font-mono text-sm text-sky-300">// step 1 of 3</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Start with a 2-minute challenge
          </h1>
          <p className="text-slate-300">
            Three short logic problems: read a few lines of code or a set of dependencies and reason
            about what happens. No account, nothing to install — your progress stays in this
            browser.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setStep('warm-up');
              }}
            >
              Start the challenge
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setStep('goal');
              }}
            >
              Skip, choose my goal
            </Button>
          </div>
        </>
      )}

      {step === 'result' && warmUp && (
        <>
          <p className="font-mono text-sm text-sky-300">// step 2 of 3</p>
          <h1 className="text-3xl font-semibold text-white">
            {warmUp.metrics.correct} of {warmUp.metrics.total} solved
          </h1>
          <p className="text-slate-300">
            That was <strong>logic</strong>: predicting what a program does and in which order
            things must happen. It is the thinking behind every line of code — and it is exactly
            what the lessons teach and the games let you practise.{' '}
            {warmUp.metrics.correct < warmUp.metrics.total &&
              'Missing some at the start is normal; the explanations after each answer are where the learning happens.'}
          </p>
          <div>
            <Button
              onClick={() => {
                setStep('goal');
              }}
            >
              Continue
            </Button>
          </div>
        </>
      )}

      {step === 'goal' && (
        <>
          <p className="font-mono text-sm text-sky-300">// step 3 of 3</p>
          <h1 className="text-3xl font-semibold text-white">What do you want to do?</h1>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Your goal</legend>
            {GOALS.map((option) => (
              <label
                key={option.goal}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky-400 ${
                  goal === option.goal
                    ? 'border-sky-400/70 bg-sky-400/10'
                    : 'border-slate-700 bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="goal"
                  checked={goal === option.goal}
                  onChange={() => {
                    setGoal(option.goal);
                  }}
                  className="mt-1 accent-sky-400"
                />
                <span>
                  <span className="block font-semibold text-white">{option.title}</span>
                  <span className="block text-sm text-slate-400">{option.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <Card>
            <label htmlFor={targetId} className="text-sm font-medium text-white">
              How many days a week do you want to practise?
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                id={targetId}
                type="range"
                min={1}
                max={7}
                value={target}
                onChange={(e) => {
                  setTarget(Number(e.target.value));
                }}
                className="w-48 accent-sky-400"
              />
              <span className="font-mono text-white">{target} days</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Your own target, shown on your dashboard. Missing a day costs nothing: there are no
              penalties.
            </p>
          </Card>
          <div>
            <Button
              onClick={() => {
                void finish(goal);
              }}
            >
              {goal === 'train' ? 'Go to training' : 'Start the first lesson'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
