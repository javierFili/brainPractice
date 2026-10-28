import { type UserProfile } from '@/domain/profile';
import type { UserProgress } from '@/domain/progress';
import { useServices } from '@/app/providers/servicesContext';
import { useProfile } from './useProfile';
import { useProgress } from './useProgress';

export type AppData =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | {
      readonly status: 'ready';
      readonly progress: UserProgress;
      readonly profile: UserProfile;
    };

/** Game progress and profile, loaded together for the overview screens. */
export function useAppData(): AppData & { reload: () => void } {
  const { progress: repository } = useServices();
  const { state: progress, reload: reloadProgress } = useProgress(repository);
  const { state: profile, reload: reloadProfile } = useProfile();
  const reload = () => {
    reloadProgress();
    reloadProfile();
  };
  if (progress.status === 'error' || profile.status === 'error') return { status: 'error', reload };
  if (progress.status === 'loading' || profile.status === 'loading')
    return { status: 'loading', reload };
  return {
    status: 'ready',
    progress: progress.progress,
    profile: profile.value,
    reload,
  };
}
