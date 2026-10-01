import type { RouteObject } from 'react-router';
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
            path: 'assessment',
            lazy: async () => ({
              Component: (await import('@/features/assessment/AssessmentPage')).AssessmentPage,
            }),
          },
          {
            path: 'profile',
            lazy: async () => ({
              Component: (await import('@/features/profile/ProfilePage')).ProfilePage,
            }),
          },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
];
