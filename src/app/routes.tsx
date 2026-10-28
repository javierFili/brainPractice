import { Navigate, type RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { NotFound } from '@/features/shared/NotFound';
import { PageLoading } from '@/features/shared/PageLoading';
import { RouteError } from '@/features/shared/RouteError';

/** Screens are loaded on demand so the first paint only ships the shell and the current page. */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    hydrateFallbackElement: <PageLoading />,
    errorElement: <RouteError />,
    children: [
      {
        // Screen errors render inside the shell, so navigation keeps working.
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/features/home/HomePage')).HomePage }),
          },
          {
            path: 'games',
            lazy: async () => ({
              Component: (await import('@/features/catalog/CatalogPage')).CatalogPage,
            }),
          },
          {
            path: 'games/:gameId',
            lazy: async () => ({
              Component: (await import('@/features/game-intro/GameIntroPage')).GameIntroPage,
            }),
          },
          {
            path: 'games/:gameId/play/:level',
            lazy: async () => ({ Component: (await import('@/features/play/PlayPage')).PlayPage }),
          },
          {
            path: 'start',
            lazy: async () => ({
              Component: (await import('@/features/onboarding/OnboardingPage')).OnboardingPage,
            }),
          },
          {
            path: 'daily',
            lazy: async () => ({
              Component: (await import('@/features/daily/DailyPage')).DailyPage,
            }),
          },
          {
            path: 'learn',
            lazy: async () => ({
              Component: (await import('@/features/learn/LearnPage')).LearnPage,
            }),
          },
          {
            path: 'learn/review',
            lazy: async () => ({
              Component: (await import('@/features/learn/ReviewPage')).ReviewPage,
            }),
          },
          {
            path: 'learn/:lessonId',
            lazy: async () => ({
              Component: (await import('@/features/learn/LessonPage')).LessonPage,
            }),
          },
          {
            path: 'assessment',
            lazy: async () => ({
              Component: (await import('@/features/assessment/AssessmentPage')).AssessmentPage,
            }),
          },
          {
            path: 'continue',
            lazy: async () => ({
              Component: (await import('@/features/home/ContinuePage')).ContinuePage,
            }),
          },
          {
            path: 'train/:collectionId',
            lazy: async () => ({
              Component: (await import('@/features/catalog/CollectionPage')).CollectionPage,
            }),
          },
          {
            path: 'quick',
            lazy: async () => ({
              Component: (await import('@/features/quick/QuickSessionPage')).QuickSessionPage,
            }),
          },
          {
            path: 'paths',
            lazy: async () => ({
              Component: (await import('@/features/paths/PathPage')).PathsIndexPage,
            }),
          },
          {
            path: 'paths/:pathId',
            lazy: async () => ({
              Component: (await import('@/features/paths/PathPage')).PathPage,
            }),
          },
          {
            path: 'progress',
            lazy: async () => ({
              Component: (await import('@/features/progress/ProgressPage')).ProgressPage,
            }),
          },
          {
            path: 'assessment/history',
            lazy: async () => ({
              Component: (await import('@/features/assessment/AssessmentHistoryPages'))
                .AssessmentHistoryPage,
            }),
          },
          {
            path: 'assessment/profile',
            lazy: async () => ({
              Component: (await import('@/features/assessment/AssessmentHistoryPages'))
                .AssessmentProfilePage,
            }),
          },
          {
            path: 'learn/thinking',
            lazy: async () => ({
              Component: (await import('@/features/learn/ThinkingPage')).ThinkingPage,
            }),
          },
          {
            path: 'settings',
            lazy: async () => ({
              Component: (await import('@/features/settings/SettingsPages')).PreferencesPage,
            }),
          },
          {
            path: 'settings/accessibility',
            lazy: async () => ({
              Component: (await import('@/features/settings/SettingsPages')).AccessibilityPage,
            }),
          },
          {
            path: 'settings/data',
            lazy: async () => ({
              Component: (await import('@/features/settings/SettingsPages')).DataPage,
            }),
          },
          { path: 'train', element: <Navigate to="/games" replace /> },
          { path: 'profile', element: <Navigate to="/progress" replace /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
];
