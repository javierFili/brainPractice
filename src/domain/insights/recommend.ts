import {
  conceptOf,
  courseProgress,
  dueReviews,
  lessonsOf,
  nextLesson,
  type Course,
  type LearningProgress,
  type Lesson,
} from '../learning';
import type { DayKey, UserProfile } from '../profile/profile';
import type { UserProgress } from '../progress/progress';
import type { CognitiveArea } from '../shared/cognitiveArea';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import { cognitiveProfile } from './cognitiveProfile';
import type { DailyChallenge } from './daily';

export type RecommendationKind = 'review' | 'lesson' | 'daily' | 'train' | 'assessment';

export interface Recommendation {
  readonly kind: RecommendationKind;
  readonly title: string;
  /** Always says why, in terms of the learner's own progress. */
  readonly reason: string;
  readonly href: string;
  readonly minutes: number;
}

export interface RecommendationInput {
  readonly course: Course;
  readonly learning: LearningProgress;
  readonly games: UserProgress;
  readonly profile: UserProfile;
  readonly now: number;
  readonly today: DayKey;
  readonly daily: DailyChallenge;
  readonly gameOfArea: Readonly<Partial<Record<CognitiveArea, string>>>;
  readonly gameName: (gameId: string) => string;
}

export const MAX_RECOMMENDATIONS = 4;

/** The lesson the learner is working on: the next open one, or the last completed. */
function currentLesson(course: Course, learning: LearningProgress): Lesson | null {
  return (
    nextLesson(course, learning) ??
    [...lessonsOf(course)].reverse().find((l) => learning.lessons[l.id]?.completedAt != null) ??
    null
  );
}

/**
 * What to do next, in order: what is due (review), what moves the goal forward (lesson), the
 * daily habit, and training linked to what is being learned. Each item explains itself. Pure.
 */
export function recommend(input: RecommendationInput): Recommendation[] {
  const { course, learning, games, profile, now, today, daily } = input;
  const items: Recommendation[] = [];
  const learns = profile.goal !== 'train';

  const due = dueReviews(learning, now);
  if (due.length > 0) {
    const names = due
      .slice(0, 4)
      .map((item) => conceptOf(course, item.conceptId)?.name ?? item.conceptId);
    items.push({
      kind: 'review',
      title: `Review: ${names.join(', ')}`,
      reason:
        'You learned these a while ago. Recalling them now, just as they start to fade, is what makes them last.',
      href: '/learn/review',
      minutes: Math.min(4, due.length) * 2,
    });
  }

  const lesson = nextLesson(course, learning);
  if (learns && lesson) {
    const { completedLessons, totalLessons } = courseProgress(course, learning);
    items.push({
      kind: 'lesson',
      title: `Lesson: ${lesson.title}`,
      reason:
        completedLessons === 0
          ? `Start ${course.title} from the beginning: ${lesson.objective.replace(/^You will be able to /, 'you will be able to ')}`
          : `Continue ${course.title} — ${completedLessons} of ${totalLessons} lessons done.`,
      href: `/learn/${lesson.id}`,
      minutes: lesson.minutes,
    });
  }

  if (!profile.daily[today]) {
    items.push({
      kind: 'daily',
      title: `Daily challenge · ${input.gameName(daily.gameId)}`,
      reason: 'Five quick problems, the same for everyone today, at your level.',
      href: '/daily',
      minutes: 3,
    });
  }

  const standings = cognitiveProfile(games, input.gameOfArea);
  const focus = currentLesson(course, learning);
  const links =
    learns && focus
      ? focus.concepts.flatMap((id) => conceptOf(course, id)?.cognitiveLinks ?? [])
      : [];
  const rank = (area: CognitiveArea) => {
    const standing = standings.find((s) => s.area === area);
    return standing?.recentPerformance ?? -1;
  };
  const link = [...links].sort((a, b) => rank(a.area) - rank(b.area))[0];
  if (link && focus) {
    const standing = standings.find((s) => s.area === link.area);
    const level = Math.max(link.level, standing?.suggestedLevel ?? 1) as DifficultyLevel;
    const concept =
      focus.concepts.map((id) => conceptOf(course, id)?.name).find((n) => n !== undefined) ?? '';
    items.push({
      kind: 'train',
      title: `${input.gameName(link.gameId)} · level ${level}`,
      reason: `You are learning ${concept.toLowerCase()}. ${link.why}`,
      href: `/games/${link.gameId}/play/${level}`,
      minutes: 3,
    });
  } else {
    // Training-focused learners (or no lesson context): practise the least developed area.
    const weakest = [...standings]
      .filter((s) => s.gameId !== null)
      .sort(
        (a, b) =>
          (a.recentPerformance ?? -1) - (b.recentPerformance ?? -1) ||
          a.clearedLevel - b.clearedLevel,
      )[0];
    if (weakest?.gameId) {
      const level = weakest.suggestedLevel;
      items.push({
        kind: 'train',
        title: `${input.gameName(weakest.gameId)} · level ${level}`,
        reason:
          weakest.recentPerformance === null
            ? 'You have not trained this area yet.'
            : `Your least practised area lately (recent performance ${weakest.recentPerformance}).`,
        href: `/games/${weakest.gameId}/play/${level}`,
        minutes: 3,
      });
    }
  }

  const sessions = games.recentSessions.filter((s) => s.completed).length;
  if ((games.assessments ?? []).length === 0 && sessions >= 3) {
    items.push({
      kind: 'assessment',
      title: 'Take the assessment',
      reason:
        'You have trained a few times: a baseline across all five areas shows where to focus next.',
      href: '/assessment',
      minutes: 30,
    });
  }
  return items.slice(0, MAX_RECOMMENDATIONS);
}
