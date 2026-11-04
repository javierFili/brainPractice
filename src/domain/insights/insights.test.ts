import { applyLessonResult, DAY_MS, emptyLearningProgress } from '../learning';
import { applySessionResult, emptyProgress, type UserProgress } from '../progress/progress';
import { completeOnboarding, emptyProfile, recordDaily } from '../profile/profile';
import { gameIdOf } from '../shared/ids';
import { fixtureCourse, variablesLesson } from '@/test/fixtures/learningCourse';
import { resultFixture } from '@/test/fixtures/results';
import { cognitiveProfile } from './cognitiveProfile';
import { DAILY_CHALLENGE_COUNT, dailyChallenge } from './daily';
import { recommend, type RecommendationInput } from './recommend';
import { en } from '@/test/i18n';

const GAMES = ['algorithmic-logic', 'code-memory', 'code-scan', 'bug-hunter', 'pattern-architect'];
const gameOfArea = {
  logic: 'algorithmic-logic',
  memory: 'code-memory',
  speed: 'code-scan',
  attention: 'bug-hunter',
  patterns: 'pattern-architect',
} as const;

const played = (
  gameId: string,
  level: 1 | 2 | 3,
  performanceIndex: number,
  progress: UserProgress = emptyProgress(),
) =>
  applySessionResult(
    progress,
    resultFixture({ gameId: gameIdOf(gameId), level, performanceIndex }),
  );

describe('daily challenge', () => {
  it('is the same for everyone on a day, rotates the game daily and uses the learner level', () => {
    const a = dailyChallenge('2026-10-01', GAMES, {});
    expect(dailyChallenge('2026-10-01', GAMES, {})).toEqual(a);
    const week = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'].map(
      (day) => dailyChallenge(day, GAMES, {}).gameId,
    );
    expect(new Set(week).size).toBe(5);
    expect(dailyChallenge('2026-10-02', GAMES, {}).seed).not.toBe(a.seed);
    const progress = played(a.gameId, 1, 90);
    expect(dailyChallenge('2026-10-01', GAMES, progress.games).level).toBe(2);
    expect(DAILY_CHALLENGE_COUNT).toBeLessThanOrEqual(6);
  });
});

describe('cognitive profile', () => {
  it('reports cleared level, suggested level and recent timed performance per area', () => {
    let progress = played('code-scan', 1, 90);
    progress = played('code-scan', 2, 50, progress);
    const speed = cognitiveProfile(progress, gameOfArea).find((s) => s.area === 'speed');
    expect(speed).toEqual({
      area: 'speed',
      gameId: 'code-scan',
      clearedLevel: 1,
      suggestedLevel: 2,
      recentPerformance: 70,
      sessions: 2,
    });
    expect(cognitiveProfile(progress, gameOfArea).find((s) => s.area === 'memory')).toMatchObject({
      clearedLevel: 0,
      recentPerformance: null,
    });
  });
});

describe('recommendations', () => {
  const base = (overrides: Partial<RecommendationInput> = {}): RecommendationInput => ({
    course: fixtureCourse,
    learning: emptyLearningProgress(),
    games: emptyProgress(),
    profile: completeOnboarding(emptyProfile(), { goal: 'both', weeklyTarget: 4, at: 0 }),
    now: 0,
    today: '2026-10-01',
    daily: dailyChallenge('2026-10-01', GAMES, {}),
    gameOfArea,
    gameName: (id) => `Game ${id}`,
    ...overrides,
  });

  it('starts a new learner with the first lesson, the daily challenge and related training', () => {
    const kinds = recommend(base()).map((r) => r.kind);
    expect(kinds).toEqual(['lesson', 'daily', 'train']);
    const train = recommend(base()).find((r) => r.kind === 'train');
    expect(en(train?.reason ?? '')).toMatch(/You are learning Variables\./);
    expect(train?.href).toBe('/games/code-memory/play/2');
  });

  it('puts due reviews first, and explains every item', () => {
    const learning = applyLessonResult(emptyLearningProgress(), variablesLesson, {
      lessonId: variablesLesson.id,
      outcomes: [],
      score: 1,
      passed: true,
      startedAt: 0,
      endedAt: 0,
    });
    const items = recommend(base({ learning, now: DAY_MS }));
    expect(items[0]).toMatchObject({ kind: 'review', href: '/learn/review' });
    expect(en(items[0]?.title ?? '')).toBe('Review: Variables');
    expect(en(items.find((r) => r.kind === 'lesson')?.title ?? '')).toBe(
      'Lesson: Fixture conditions',
    );
    for (const item of items) expect(en(item.reason).length).toBeGreaterThan(10);
  });

  it('drops the daily challenge once done and lessons for training-only goals', () => {
    const profile = recordDaily(
      completeOnboarding(emptyProfile(), { goal: 'train', weeklyTarget: 4, at: 0 }),
      '2026-10-01',
      {
        gameId: 'code-scan',
        level: 1,
        seed: dailyChallenge('2026-10-01', GAMES, {}).seed,
        performanceIndex: 50,
        completedAt: 1,
      },
    );
    const items = recommend(base({ profile }));
    expect(items.map((r) => r.kind)).toEqual(['train']);
    expect(en(items[0]?.reason ?? '')).toMatch(/not trained this area yet/);
  });

  it('suggests a baseline assessment after a few sessions', () => {
    let games = played('code-scan', 1, 60);
    games = played('code-scan', 1, 60, games);
    games = played('bug-hunter', 1, 60, games);
    expect(recommend(base({ games })).map((r) => r.kind)).toContain('assessment');
  });
});
