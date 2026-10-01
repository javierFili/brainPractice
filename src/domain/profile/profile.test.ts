import {
  completeOnboarding,
  emptyProfile,
  lastSevenDays,
  recordActivity,
  recordDaily,
  recoverProfile,
  weekSummary,
} from './profile';
import { toSeed } from '../random/seed';

const daily = {
  gameId: 'code-scan',
  level: 2,
  seed: toSeed(1),
  performanceIndex: 80,
  completedAt: 5,
} as const;

describe('user profile and habits', () => {
  it('stores the goal and a weekly target clamped to 1–7, keeping the first onboarding date', () => {
    const once = completeOnboarding(emptyProfile(), { goal: 'learn', weeklyTarget: 12, at: 10 });
    expect(once).toMatchObject({ goal: 'learn', weeklyTarget: 7, onboardedAt: 10 });
    expect(completeOnboarding(once, { goal: 'both', weeklyTarget: 0, at: 20 })).toMatchObject({
      goal: 'both',
      weeklyTarget: 1,
      onboardedAt: 10,
    });
  });

  it('records each active day once, in order', () => {
    let profile = recordActivity(emptyProfile(), '2026-10-02');
    profile = recordActivity(profile, '2026-10-01');
    profile = recordActivity(profile, '2026-10-02');
    expect(profile.activeDays).toEqual(['2026-10-01', '2026-10-02']);
  });

  it('records a daily challenge only once per day, and counts it as activity', () => {
    const first = recordDaily(emptyProfile(), '2026-10-01', daily);
    const again = recordDaily(first, '2026-10-01', { ...daily, performanceIndex: 10 });
    expect(again.daily['2026-10-01']?.performanceIndex).toBe(80);
    expect(again.activeDays).toEqual(['2026-10-01']);
  });

  it('lists the last seven calendar days across month boundaries', () => {
    expect(lastSevenDays('2026-03-02')).toEqual([
      '2026-02-24',
      '2026-02-25',
      '2026-02-26',
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
  });

  it('summarises the week against the target, and the streak without punishing today', () => {
    const profile = ['2026-09-27', '2026-09-29', '2026-09-30'].reduce(recordActivity, {
      ...emptyProfile(),
      weeklyTarget: 3,
    });
    const before = weekSummary(profile, '2026-10-01');
    expect(before).toMatchObject({ activeCount: 3, target: 3, reached: true, streak: 2 });
    expect(weekSummary(recordActivity(profile, '2026-10-01'), '2026-10-01').streak).toBe(3);
    expect(weekSummary(profile, '2026-10-03').streak).toBe(0);
  });

  it('recovers persisted profiles field by field', () => {
    const good = recordDaily(
      completeOnboarding(emptyProfile(), { goal: 'train', weeklyTarget: 3, at: 1 }),
      '2026-10-01',
      daily,
    );
    expect(recoverProfile(JSON.parse(JSON.stringify(good)))).toEqual({ value: good, discarded: 0 });
    const damaged = {
      ...good,
      goal: 'world-domination',
      activeDays: ['2026-10-01', 'yesterday'],
      daily: { nope: daily },
    };
    expect(recoverProfile(damaged)).toEqual({
      value: { ...good, goal: null, daily: {} },
      discarded: 3,
    });
    expect(recoverProfile({ schemaVersion: 2 })).toBeNull();
  });
});
