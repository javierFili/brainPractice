import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  isLevelCleared,
  isLevelUnlocked,
  suggestedLevel,
  UNLOCK_AFTER_PLAYS,
  UNLOCK_PERFORMANCE_INDEX,
} from '@/domain/progress';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/domain/shared';
import { useServices } from '@/app/providers/servicesContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatTile } from '@/components/ui/StatTile';
import { usePreferences } from '@/app/providers/preferencesContext';
import { Icon } from '@/components/ui/Icon';
import { CATEGORIES } from '@/features/shared/categories';
import { formatMs, formatPercent, formatPoints, formatSeconds } from '@/features/shared/format';
import { NotFound } from '@/features/shared/NotFound';
import { useProgress } from '@/features/shared/useProgress';

export function GameIntroPage() {
  const { gameId = '' } = useParams();
  const { getModule, progress } = useServices();
  const { state } = useProgress(progress);
  const navigate = useNavigate();
  const assistedId = useId();
  const [chosen, setChosen] = useState<DifficultyLevel | null>(null);
  const { preferences } = usePreferences();
  const [assistedChoice, setAssisted] = useState<boolean | null>(null);
  const assisted = assistedChoice ?? preferences.relaxedByDefault;
  const levelButtons = useRef<(HTMLButtonElement | null)[]>([]);

  const module = getModule(gameId);
  if (!module) return <NotFound message="This game does not exist." />;
  const { definition } = module;
  const meta = CATEGORIES[definition.meta.category];
  const game = state.status === 'ready' ? state.progress.games[definition.id] : undefined;
  const open = (l: DifficultyLevel) => isLevelUnlocked(game, l, preferences.freePlay);
  const suggested = suggestedLevel(game);
  const level = chosen !== null && open(chosen) ? chosen : open(suggested) ? suggested : 1;
  const profile = definition.levels[level];
  const record = game?.[level];

  /** ARIA radio group: arrows move the selection (and focus), Home/End jump to the ends. */
  const onLevelKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    const target =
      event.key === 'Home'
        ? 1
        : event.key === 'End'
          ? 10
          : delta === undefined
            ? null
            : level + delta;
    if (target === null || target < 1 || target > 10 || !open(target as DifficultyLevel)) return;
    event.preventDefault();
    setChosen(target as DifficultyLevel);
    levelButtons.current[target - 1]?.focus();
  };

  const start = () => {
    void navigate(`/games/${definition.id}/play/${level}?assisted=${assisted ? '1' : '0'}`);
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <span className={`flex items-center gap-1.5 ${meta.text}`}>
            <Icon name={meta.icon} className="h-4 w-4" />
            {meta.label}
          </span>
        }
        title={definition.name}
        description={definition.description}
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="levels-title">
            <h2 id="levels-title" className="mb-3 text-lg font-semibold text-white">
              Level
            </h2>
            <div
              role="radiogroup"
              aria-labelledby="levels-title"
              onKeyDown={onLevelKey}
              className="grid grid-cols-5 gap-2 sm:grid-cols-10"
            >
              {DIFFICULTY_LEVELS.map((l) => {
                const selected = l === level;
                const cleared = isLevelCleared(game?.[l]);
                const locked = !open(l);
                return (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    ref={(element) => {
                      levelButtons.current[l - 1] = element;
                    }}
                    aria-label={`Level ${l}${cleared ? ', cleared' : ''}${locked ? ', locked' : ''}${l === suggested && !locked ? ', suggested' : ''}`}
                    aria-disabled={locked}
                    onClick={() => {
                      if (!locked) setChosen(l);
                    }}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border font-mono text-lg transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                      selected
                        ? 'border-brand bg-brand/15 text-ink'
                        : locked
                          ? 'cursor-not-allowed border-dashed border-line bg-surface text-ink-muted'
                          : 'border-line bg-raised text-ink-soft hover:border-line-strong'
                    }`}
                  >
                    {locked ? <Icon name="lock" className="h-4 w-4" /> : l}
                    {cleared && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1 right-1.5 text-xs text-emerald-300"
                      >
                        ✓
                      </span>
                    )}
                    {l === suggested && !selected && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 h-1 w-1 rounded-full bg-sky-400"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {preferences.freePlay
                ? '✓ cleared (performance ≥ 70) · dot = suggested level · free play: every level is open.'
                : `✓ cleared (performance ≥ 70) · dot = suggested level. Level 1 is always open; the next level opens after a session with performance ≥ ${UNLOCK_PERFORMANCE_INDEX} or after ${UNLOCK_AFTER_PLAYS} completed sessions. Free play (Settings) opens all.`}
            </p>
          </section>

          <section
            aria-labelledby="level-detail"
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"
          >
            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
              Level {level} · {profile.tier}
            </p>
            <h2 id="level-detail" className="mt-1 text-lg font-semibold text-white">
              {profile.objective}
            </h2>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-slate-400">Challenges</dt>
                <dd className="font-mono text-white">{profile.challengeCount}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Time limit</dt>
                <dd className="font-mono text-white">
                  {assisted ? 'None' : formatSeconds(profile.timing.limitMs)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Target pace</dt>
                <dd className="font-mono text-white">{formatSeconds(profile.timing.targetMs)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Button onClick={start}>Start level {level}</Button>
              <label
                htmlFor={assistedId}
                className="flex items-center gap-2 text-sm text-slate-300"
              >
                <input
                  id={assistedId}
                  type="checkbox"
                  checked={assisted}
                  onChange={(e) => {
                    setAssisted(e.target.checked);
                  }}
                  className="h-4 w-4 accent-sky-400"
                />
                Relaxed timing (no answer limit, double memorisation time, not counted in records)
                {!definition.meta.relaxedFriendly &&
                  ' — this game is about speed, so its signals stay quick'}
              </label>
            </div>
          </section>

          <section aria-labelledby="how-title">
            <h2 id="how-title" className="mb-3 text-lg font-semibold text-white">
              How to play
            </h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
              {definition.instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>
                {definition.meta.keyboard === 'full'
                  ? 'Playable with mouse, touch or keyboard (Tab, arrows, Enter; number keys pick options).'
                  : 'Some steps need a pointer or touch; options also have number keys.'}{' '}
                You can reopen these instructions during the game.
              </li>
            </ul>
          </section>

          <section
            aria-labelledby="scoring-title"
            className="rounded-xl border border-line bg-surface p-5 text-sm text-ink-soft"
          >
            <h2 id="scoring-title" className="mb-2 text-lg font-semibold text-ink">
              How your result is calculated
            </h2>
            <p>{definition.meta.scoringSummary}</p>
            <p className="mt-2 text-ink-muted">
              Practises: {definition.skills.map((sk) => sk.replaceAll('-', ' ')).join(', ')} · about{' '}
              {definition.meta.estimatedMinutes} min · results are saved only on this device.
            </p>
            {definition.meta.accessibilityNotes !== undefined && (
              <p className="mt-2 text-ink-muted">
                Accessibility: {definition.meta.accessibilityNotes}
              </p>
            )}
          </section>
        </div>

        <aside aria-labelledby="record-title" className="flex flex-col gap-3">
          <h2 id="record-title" className="text-lg font-semibold text-white">
            Your record · level {level}
          </h2>
          {record ? (
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <StatTile label="Best performance" value={`${record.bestPerformanceIndex}/100`} />
              <StatTile label="Best score" value={formatPoints(record.bestScore)} />
              <StatTile label="Best accuracy" value={formatPercent(record.bestAccuracy)} />
              <StatTile
                label="Best median time"
                value={formatMs(record.bestMedianResponseMs)}
                hint={`${record.plays} completed ${record.plays === 1 ? 'session' : 'sessions'}`}
              />
            </dl>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              Not played yet. Metrics tracked: score, accuracy, response time, streak and
              performance index.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
