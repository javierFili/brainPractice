import { emptyProfile } from '../profile/profile';
import { emptyProgress, type SessionSummary, type UserProgress } from '../progress/progress';
import { toSeed } from '../random/seed';
import { milestones } from './milestones';
import {
  compareWith,
  continueTarget,
  levelTrend,
  planQuickSession,
  recommendTraining,
  type CatalogEntry,
} from './training';

const DAY = 86_400_000;
const entry = (
  id: string,
  category: CatalogEntry['category'],
  relaxedFriendly = true,
): CatalogEntry => ({
  id,
  name: id,
  category,
  audiences: ['adults'],
  estimatedMinutes: 4,
  relaxedFriendly,
});
const CATALOG = [
  entry('m1', 'memory'),
  entry('m2', 'memory'),
  entry('l1', 'logic'),
  entry('s1', 'speed', false),
  entry('a1', 'attention'),
  entry('p1', 'patterns'),
  entry('c1', 'programming'),
];
const GENERAL = ['memory', 'logic', 'speed', 'attention', 'patterns'] as const;

const session = (
  gameId: string,
  endedAt: number,
  extra: Partial<SessionSummary> = {},
): SessionSummary => ({
  gameId,
  level: 1,
  seed: toSeed(1),
  score: 100,
  accuracy: 0.8,
  performanceIndex: 60,
  completed: true,
  assisted: false,
  endedAt,
  durationMs: 60_000,
  ...extra,
});

const record = (bestPerformanceIndex: number) => ({
  plays: 1,
  bestScore: 0,
  bestAccuracy: 0,
  bestPerformanceIndex,
  bestMedianResponseMs: null,
  lastPlayedAt: 0,
});

const withSessions = (
  sessions: SessionSummary[],
  games: UserProgress['games'] = {},
): UserProgress => ({
  ...emptyProgress(),
  recentSessions: sessions,
  games,
  totals: { sessions: sessions.length, practiceMs: sessions.length * 60_000 },
});

describe('recommendTraining', () => {
  it('suggests route games first to a new player', () => {
    const s = recommendTraining({
      catalog: CATALOG,
      progress: emptyProgress(),
      featured: ['a1', 'p1'],
      categories: [...GENERAL],
      now: 0,
    });
    expect(s.map((x) => x.gameId)).toEqual(['a1', 'p1', 'm1']);
    expect(s.every((x) => x.kind === 'start' && x.level === 1)).toBe(true);
  });

  it('offers the next level once one is cleared, the least practised area, and a new game', () => {
    const now = 30 * DAY;
    const progress = withSessions(
      [
        session('m1', now - DAY, { performanceIndex: 80 }),
        session('m2', now - 2 * DAY),
        session('l1', now - 3 * DAY),
      ],
      { m1: { 1: record(80) }, m2: { 1: record(40) }, l1: { 1: record(40) } },
    );
    const s = recommendTraining({
      catalog: CATALOG,
      progress,
      featured: [],
      categories: [...GENERAL],
      now,
    });
    expect(s[0]).toMatchObject({ kind: 'level-up', gameId: 'm1', level: 2 });
    expect(s[1]).toMatchObject({ kind: 'variety', gameId: 's1' });
    expect(s[1]?.reason).toMatch(/not practised mental speed/);
    expect(s[2]).toMatchObject({ kind: 'discover', gameId: 'a1' });
    expect(new Set(s.map((x) => x.gameId)).size).toBe(s.length);
  });

  it('leaves programming out unless it is part of the requested categories', () => {
    const s = recommendTraining({
      catalog: CATALOG,
      progress: emptyProgress(),
      featured: [],
      categories: [...GENERAL],
      now: 0,
    });
    expect(s.some((x) => x.gameId === 'c1')).toBe(false);
  });
});

describe('continueTarget', () => {
  it('repeats an uncleared level and moves on after clearing it', () => {
    const exists = () => true;
    expect(
      continueTarget(withSessions([session('m1', 1)], { m1: { 1: record(40) } }), exists),
    ).toMatchObject({ level: 1, cleared: false });
    expect(
      continueTarget(withSessions([session('m1', 1)], { m1: { 1: record(75) } }), exists),
    ).toMatchObject({ level: 2, cleared: true });
    expect(continueTarget(emptyProgress(), exists)).toBeNull();
  });
});

describe('planQuickSession', () => {
  const plan = (minutes: number, extra: Partial<Parameters<typeof planQuickSession>[0]> = {}) =>
    planQuickSession({
      minutes,
      catalog: CATALOG,
      progress: emptyProgress(),
      featured: [],
      categories: [...GENERAL],
      seed: toSeed(42),
      challengeCountOf: () => 6,
      ...extra,
    });

  it('sizes the session by duration and spreads categories', () => {
    expect(plan(3)).toHaveLength(1);
    expect(plan(5)).toHaveLength(2);
    const ten = plan(10);
    expect(ten).toHaveLength(4);
    const categories = ten.map((s) => CATALOG.find((g) => g.id === s.gameId)?.category);
    expect(new Set(categories).size).toBe(4);
  });

  it('is reproducible for a seed and keeps blocks between 2 and the regular length', () => {
    expect(plan(15)).toEqual(plan(15));
    for (const step of plan(15)) {
      expect(step.challengeCount).toBeGreaterThanOrEqual(2);
      expect(step.challengeCount).toBeLessThanOrEqual(6);
    }
  });

  it('can stick to games that work without time limits', () => {
    expect(plan(15, { relaxedOnly: true }).some((s) => s.gameId === 's1')).toBe(false);
  });
});

describe('comparisons', () => {
  it('compares only with the previous completed session of the same game, level and mode', () => {
    const current = session('m1', 50, { accuracy: 0.9, performanceIndex: 70 });
    const sessions = [
      current,
      session('m1', 40, { level: 2 }),
      session('m1', 30, { assisted: true }),
      session('m1', 20, { completed: false }),
      session('m1', 10, { accuracy: 0.6, performanceIndex: 50 }),
    ];
    const comparison = compareWith(sessions, current);
    expect(comparison?.previous.endedAt).toBe(10);
    expect(comparison?.accuracyDelta).toBeCloseTo(0.3);
    expect(comparison?.performanceDelta).toBe(20);
    expect(compareWith([current], current)).toBeNull();
  });

  it('builds a level trend oldest first, ignoring relaxed and unfinished runs', () => {
    const sessions = [
      session('m1', 3, { performanceIndex: 70 }),
      session('m1', 2, { performanceIndex: 10, assisted: true }),
      session('m1', 1, { performanceIndex: 50 }),
    ];
    expect(levelTrend(sessions, 'm1', 1)).toEqual([50, 70]);
  });
});

describe('milestones', () => {
  it('reflects stored activity only', () => {
    const none = milestones({
      progress: emptyProgress(),
      profile: emptyProfile(),
      categoryOf: () => 'memory',
    });
    expect(none.every((m) => !m.achieved)).toBe(true);
    const some = milestones({
      progress: withSessions([session('m1', 1), session('l1', 2)], { m1: { 1: record(75) } }),
      profile: emptyProfile(),
      categoryOf: (id) => CATALOG.find((g) => g.id === id)?.category,
    });
    const achieved = some.filter((m) => m.achieved).map((m) => m.id);
    expect(achieved).toEqual(['first-session', 'first-clear']);
    expect(some.find((m) => m.id === 'all-areas')).toMatchObject({ current: 2, target: 5 });
  });
});
