import type { RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { AssessmentPage } from '@/features/assessment/AssessmentPage';
import { CatalogPage } from '@/features/catalog/CatalogPage';
import { GameIntroPage } from '@/features/game-intro/GameIntroPage';
import { HomePage } from '@/features/home/HomePage';
import { PlayPage } from '@/features/play/PlayPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { NotFound } from '@/features/shared/NotFound';

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'games', element: <CatalogPage /> },
      { path: 'games/:gameId', element: <GameIntroPage /> },
      { path: 'games/:gameId/play/:level', element: <PlayPage /> },
      { path: 'assessment', element: <AssessmentPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
