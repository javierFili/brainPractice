import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
import { LanguageSelector } from '@/components/navigation/LanguageSelector';

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
  const { t } = useTranslation('settings');
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
        {checked ? t('toggle.on') : t('toggle.off')}
      </span>
    </button>
  );
}

const selectClass =
  'rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand';

export function PreferencesPage() {
  const { t } = useTranslation('settings');
  const { preferences, update } = usePreferences();
  const routeId = useId();
  const goalId = useId();
  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('preferences.title')}
        description={t('preferences.description')}
      />
      <div className="rounded-2xl border border-line bg-surface px-5">
        <Setting
          title={t('preferences.language.title')}
          description={t('preferences.language.description')}
        >
          <LanguageSelector className="min-w-44" />
        </Setting>
        <Setting
          title={t('preferences.route.title')}
          description={t('preferences.route.description')}
        >
          <select
            id={routeId}
            aria-label={t('preferences.route.title')}
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
            <option value="">{t('preferences.route.none')}</option>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {t(`common:audiences.${a}`)}
              </option>
            ))}
          </select>
        </Setting>
        <Setting
          title={t('preferences.goal.title')}
          description={t('preferences.goal.description')}
        >
          <select
            id={goalId}
            aria-label={t('preferences.goal.title')}
            value={preferences.dailyGoalMinutes ?? ''}
            onChange={(e) => {
              update({ dailyGoalMinutes: e.target.value === '' ? null : Number(e.target.value) });
            }}
            className={selectClass}
          >
            <option value="">{t('preferences.goal.none')}</option>
            {DAILY_GOAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {t('preferences.goal.option', { count: m })}
              </option>
            ))}
          </select>
        </Setting>
        <Setting
          title={t('preferences.relaxed.title')}
          description={t('preferences.relaxed.description')}
        >
          <Toggle
            label={t('preferences.relaxed.title')}
            checked={preferences.relaxedByDefault}
            onChange={(relaxedByDefault) => {
              update({ relaxedByDefault });
            }}
          />
        </Setting>
        <Setting
          title={t('preferences.freePlay.title')}
          description={t('preferences.freePlay.description')}
        >
          <Toggle
            label={t('preferences.freePlay.title')}
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
  normal: 'accessibility.textSize.normal',
  large: 'accessibility.textSize.large',
  'x-large': 'accessibility.textSize.xLarge',
};

export function AccessibilityPage() {
  const { t } = useTranslation('settings');
  const { preferences, update } = usePreferences();
  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('accessibility.title')}
        description={t('accessibility.description')}
      />
      <div className="rounded-2xl border border-line bg-surface px-5">
        <Setting
          title={t('accessibility.textSize.title')}
          description={t('accessibility.textSize.description')}
        >
          <div
            role="radiogroup"
            aria-label={t('accessibility.textSize.title')}
            className="flex gap-2"
          >
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
                {t(TEXT_LABEL[size])}
              </button>
            ))}
          </div>
        </Setting>
        <Setting
          title={t('accessibility.motion.title')}
          description={t('accessibility.motion.description')}
        >
          <Toggle
            label={t('accessibility.motion.title')}
            checked={preferences.motion === 'reduce'}
            onChange={(on) => {
              update({ motion: on ? 'reduce' : 'system' });
            }}
          />
        </Setting>
        <Setting
          title={t('accessibility.comfort.title')}
          description={t('accessibility.comfort.description')}
        >
          <Toggle
            label={t('accessibility.comfort.title')}
            checked={preferences.comfort}
            onChange={(comfort) => {
              update({ comfort });
            }}
          />
        </Setting>
        <Setting
          title={t('accessibility.noLimits.title')}
          description={t('accessibility.noLimits.description')}
        >
          <Toggle
            label={t('accessibility.noLimits.title')}
            checked={preferences.relaxedByDefault}
            onChange={(relaxedByDefault) => {
              update({ relaxedByDefault });
            }}
          />
        </Setting>
      </div>
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
        <h2 className="mb-2 font-semibold text-ink">{t('accessibility.always.title')}</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t('accessibility.always.keyboard')}</li>
          <li>{t('accessibility.always.howToPlay')}</li>
          <li>{t('accessibility.always.shapes')}</li>
          <li>{t('accessibility.always.reaction')}</li>
        </ul>
      </section>
    </>
  );
}

/** Resets everything this demo stores in the browser, after an explicit confirmation. */
export function DataPage() {
  const { t } = useTranslation('settings');
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
        eyebrow={t('eyebrow')}
        title={t('data.title')}
        description={t('data.description')}
      />
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-line bg-surface p-5 text-sm text-ink-soft">
          <h2 className="mb-2 font-semibold text-ink">{t('data.stored.title')}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t('data.stored.results')}</li>
            <li>{t('data.stored.learning')}</li>
            <li>{t('data.stored.days')}</li>
            <li>{t('data.stored.preferences')}</li>
          </ul>
          <p className="mt-2">{t('data.stored.noPersonal')}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void exportData()}>
            {t('data.showJson')}
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
            {t('data.reset.title')}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{t('data.reset.description')}</p>
          {stage === 'idle' && (
            <Button
              variant="danger"
              className="mt-4"
              onClick={() => {
                setStage('confirm');
              }}
            >
              {t('data.reset.button')}
            </Button>
          )}
          {stage === 'confirm' && (
            <div
              role="alertdialog"
              aria-labelledby="confirm-reset"
              className="mt-4 flex flex-col gap-3"
            >
              <p id="confirm-reset" className="font-medium text-danger">
                {t('data.reset.confirm')}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="danger" onClick={() => void reset()}>
                  {t('data.reset.yes')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStage('idle');
                  }}
                >
                  {t('common:actions.cancel')}
                </Button>
              </div>
            </div>
          )}
          {stage === 'done' && (
            <p role="status" className="mt-4 text-success">
              {t('data.reset.done')}{' '}
              <ButtonLink to="/" variant="ghost">
                {t('data.reset.backHome')}
              </ButtonLink>
            </p>
          )}
          {stage === 'failed' && (
            <p role="alert" className="mt-4 text-danger">
              {t('data.reset.failed')}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
