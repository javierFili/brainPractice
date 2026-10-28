import { useId, useState, type ReactNode } from 'react';
import { PATHS } from '@/content/paths';
import { AUDIENCES, type Audience } from '@/domain/game';
import {
  DAILY_GOAL_OPTIONS,
  defaultPreferences,
  routeDefaults,
  TEXT_SIZES,
  type TextSize,
} from '@/domain/preferences';
import { useServices } from '@/app/providers/servicesContext';
import { usePreferences } from '@/app/providers/preferencesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';

function Setting({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <p className="font-medium text-ink">{title}</p>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        onChange(!checked);
      }}
      className={`relative inline-flex h-8 w-14 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        checked ? 'border-brand bg-brand' : 'border-line-strong bg-raised'
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-6 w-6 rounded-full bg-ink shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`}
      />
      <span aria-hidden="true" className="sr-only">
        {checked ? 'On' : 'Off'}
      </span>
    </button>
  );
}

const selectClass =
  'rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand';

const AUDIENCE_NAME: Readonly<Record<Audience, string>> = Object.fromEntries(
  PATHS.map((p) => [p.id, p.name]),
) as Record<Audience, string>;

export function PreferencesPage() {
  const { preferences, update } = usePreferences();
  const routeId = useId();
  const goalId = useId();
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Preferences"
        description="How the app suggests and paces activities. Saved on this device only."
      />
      <div className="rounded-2xl border border-line bg-surface px-5">
        <Setting
          title="Route"
          description="Optional. A route chooses suggested games and settings; it never limits what you can play."
        >
          <select
            id={routeId}
            aria-label="Route"
            value={preferences.path ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') update({ path: null });
              else {
                const path = value as Audience;
                update({ path, ...routeDefaults(path) });
              }
            }}
            className={selectClass}
          >
            <option value="">No route (general)</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_NAME[a]}
              </option>
            ))}
          </select>
        </Setting>
        <Setting
          title="Daily practice goal"
          description="A voluntary goal shown on the home screen. Not reaching it has no consequence."
        >
          <select
            id={goalId}
            aria-label="Daily practice goal"
            value={preferences.dailyGoalMinutes ?? ''}
            onChange={(e) => {
              update({ dailyGoalMinutes: e.target.value === '' ? null : Number(e.target.value) });
            }}
            className={selectClass}
          >
            <option value="">No goal</option>
            {DAILY_GOAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} minutes a day
              </option>
            ))}
          </select>
        </Setting>
        <Setting
          title="Relaxed timing by default"
          description="Start every game without answer limits and with longer memorisation time. Relaxed sessions are saved but do not set records."
        >
          <Toggle
            label="Relaxed timing by default"
            checked={preferences.relaxedByDefault}
            onChange={(relaxedByDefault) => {
              update({ relaxedByDefault });
            }}
          />
        </Setting>
        <Setting
          title="Free play"
          description="Open all ten levels of every game. Without it, level 1 is open and each next level opens after a session with performance 50+ or after three completed sessions."
        >
          <Toggle
            label="Free play"
            checked={preferences.freePlay}
            onChange={(freePlay) => {
              update({ freePlay });
            }}
          />
        </Setting>
      </div>
    </>
  );
}

const TEXT_LABEL: Readonly<Record<TextSize, string>> = {
  normal: 'Standard',
  large: 'Large',
  'x-large': 'Extra large',
};

export function AccessibilityPage() {
  const { preferences, update } = usePreferences();
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Accessibility"
        description="Adjust reading, motion and pace. Changes apply immediately."
      />
      <div className="rounded-2xl border border-line bg-surface px-5">
        <Setting
          title="Text size"
          description="Scales all text and controls. Browser zoom also works."
        >
          <div role="radiogroup" aria-label="Text size" className="flex gap-2">
            {TEXT_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={preferences.textSize === size}
                onClick={() => {
                  update({ textSize: size });
                }}
                className={`rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand ${
                  preferences.textSize === size
                    ? 'border-brand bg-brand/15 font-semibold text-ink'
                    : 'border-line bg-raised text-ink-soft'
                }`}
              >
                {TEXT_LABEL[size]}
              </button>
            ))}
          </div>
        </Setting>
        <Setting
          title="Reduce motion"
          description="Turns off transitions and decorative animation. By default the app follows your system setting."
        >
          <Toggle
            label="Reduce motion"
            checked={preferences.motion === 'reduce'}
            onChange={(on) => {
              update({ motion: on ? 'reduce' : 'system' });
            }}
          />
        </Setting>
        <Setting title="Comfortable controls" description="Larger buttons and touch targets.">
          <Toggle
            label="Comfortable controls"
            checked={preferences.comfort}
            onChange={(comfort) => {
              update({ comfort });
            }}
          />
        </Setting>
        <Setting
          title="No time limits"
          description="Relaxed timing for every game: no answer limits, double memorisation time and feedback that waits for you."
        >
          <Toggle
            label="No time limits"
            checked={preferences.relaxedByDefault}
            onChange={(relaxedByDefault) => {
              update({ relaxedByDefault });
            }}
          />
        </Setting>
      </div>
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
        <h2 className="mb-2 font-semibold text-ink">Also available everywhere</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Every game can be played with the keyboard; answer options have number keys.</li>
          <li>“How to play” reopens the instructions at any moment during a game.</li>
          <li>
            Shapes always differ in form as well as colour; feedback uses text and symbols, not only
            colour.
          </li>
          <li>
            Reaction games need quick responses; their pages say so. See docs/accessibility.md for
            known limits.
          </li>
        </ul>
      </section>
    </>
  );
}

/** Resets everything this demo stores in the browser, after an explicit confirmation. */
export function DataPage() {
  const { progress, learning, profile, preferences: preferencesRepository } = useServices();
  const { update } = usePreferences();
  const [stage, setStage] = useState<'idle' | 'confirm' | 'done' | 'failed'>('idle');
  const [exporting, setExporting] = useState<string | null>(null);

  const reset = async () => {
    try {
      await Promise.all([
        progress.clear(),
        learning.clear(),
        profile.clear(),
        preferencesRepository.clear(),
      ]);
      update(defaultPreferences());
      setStage('done');
    } catch (error) {
      console.error('[settings] Reset failed', error);
      setStage('failed');
    }
  };

  const exportData = async () => {
    const [p, l, pr] = await Promise.all([progress.get(), learning.get(), profile.get()]);
    setExporting(JSON.stringify({ progress: p, learning: l, profile: pr }, null, 2));
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Your data"
        description="This demo has no accounts and no server: everything lives in this browser’s local storage."
      />
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          <h2 className="mb-2 font-semibold text-ink">What is stored</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Game results: level, score, accuracy, timing and date of each session.</li>
            <li>Learning progress of the programming course.</li>
            <li>Days you practised, daily challenges and your weekly target.</li>
            <li>Preferences (route, text size, timing).</li>
          </ul>
          <p className="mt-2">No name, email, location or other personal details are collected.</p>
          <Button variant="secondary" className="mt-4" onClick={() => void exportData()}>
            Show my data as JSON
          </Button>
          {exporting !== null && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-line bg-canvas p-3 text-xs">
              {exporting}
            </pre>
          )}
        </section>

        <section
          aria-labelledby="reset-title"
          className="rounded-2xl border border-danger/40 bg-danger/5 p-5"
        >
          <h2 id="reset-title" className="font-semibold text-ink">
            Reset demo data
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Deletes all results, history, milestones, course progress and preferences on this
            device. This cannot be undone.
          </p>
          {stage === 'idle' && (
            <Button
              variant="danger"
              className="mt-4"
              onClick={() => {
                setStage('confirm');
              }}
            >
              Reset all data…
            </Button>
          )}
          {stage === 'confirm' && (
            <div
              role="alertdialog"
              aria-labelledby="confirm-reset"
              className="mt-4 flex flex-col gap-3"
            >
              <p id="confirm-reset" className="font-medium text-danger">
                Are you sure? Everything stored by this app on this device will be deleted.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="danger" onClick={() => void reset()}>
                  Yes, delete everything
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStage('idle');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {stage === 'done' && (
            <p role="status" className="mt-4 text-success">
              All data was deleted.{' '}
              <ButtonLink to="/" variant="ghost">
                Back to home
              </ButtonLink>
            </p>
          )}
          {stage === 'failed' && (
            <p role="alert" className="mt-4 text-danger">
              Some data could not be deleted. Your browser may be blocking storage.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
