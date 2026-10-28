import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { PATHS } from '@/content/paths';
import type { Audience } from '@/domain/game';
import { routeDefaults } from '@/domain/preferences';
import { completeOnboarding, DEFAULT_WEEKLY_TARGET } from '@/domain/profile';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/features/shared/useProfile';

const OPTIONS: readonly { id: Audience | null; name: string; tagline: string }[] = [
  ...PATHS.map((p) => ({ id: p.id, name: p.name, tagline: p.tagline })),
  { id: null, name: 'Just explore', tagline: 'No route: suggestions from every area.' },
];

/**
 * First steps, no account: pick a route (or none) and a weekly rhythm. Nothing personal is asked;
 * the route is a choice of suggestions, not a statement about anyone's abilities.
 */
export function OnboardingPage() {
  const { clock } = useServices();
  const { update: updateProfile } = useProfile();
  const { update: updatePreferences } = usePreferences();
  const navigate = useNavigate();
  const [route, setRoute] = useState<Audience | null>(null);
  const [target, setTarget] = useState(DEFAULT_WEEKLY_TARGET);
  const targetId = useId();

  const finish = async () => {
    updatePreferences(route === null ? { path: null } : { path: route, ...routeDefaults(route) });
    await updateProfile((p) =>
      completeOnboarding(p, {
        goal: route === 'programmers' ? 'both' : 'train',
        weeklyTarget: target,
        at: clock.now(),
      }),
    ).catch((error: unknown) => {
      console.error('[onboarding] Could not save the profile', error);
    });
    void navigate(route === null ? '/' : `/paths/${route}`);
  };

  return (
    <>
      <PageHeader
        eyebrow="Get started"
        title="What would you like to practise?"
        description="Choose a route to get suggestions that fit you. It is optional, changes nothing about what you can play, and you can switch any time."
      />
      <fieldset className="mb-8">
        <legend className="sr-only">Route</legend>
        <div
          role="radiogroup"
          aria-label="Route"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {OPTIONS.map((option) => (
            <button
              key={option.id ?? 'none'}
              type="button"
              role="radio"
              aria-checked={route === option.id}
              onClick={() => {
                setRoute(option.id);
              }}
              className={`flex flex-col gap-1 rounded-2xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-brand ${
                route === option.id
                  ? 'border-brand bg-brand/15'
                  : 'border-line bg-surface hover:bg-raised'
              }`}
            >
              <span className="font-semibold text-ink">{option.name}</span>
              <span className="text-sm text-ink-soft">{option.tagline}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mb-8 flex flex-col gap-2">
        <label htmlFor={targetId} className="font-semibold text-ink">
          How many days a week would you like to practise?
        </label>
        <p className="text-sm text-ink-muted">Your own target. Missing a day costs nothing.</p>
        <select
          id={targetId}
          value={target}
          onChange={(e) => {
            setTarget(Number(e.target.value));
          }}
          className="w-40 rounded-lg border border-line bg-raised px-3 py-2 text-ink"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'day' : 'days'}
            </option>
          ))}
        </select>
      </div>
      <Button onClick={() => void finish()}>Continue</Button>
    </>
  );
}
