import { useCallback, useEffect, useState } from 'react';
import { emptyProgress, type ProgressRepository, type UserProgress } from '@/domain/progress';

export type ProgressState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly progress: UserProgress }
  | { readonly status: 'error' };

export function useProgress(repository: ProgressRepository) {
  const [state, setState] = useState<ProgressState>({ status: 'loading' });

  const load = useCallback(() => {
    repository
      .get()
      .then((progress) => {
        setState({ status: 'ready', progress: progress ?? emptyProgress() });
      })
      .catch(() => {
        setState({ status: 'error' });
      });
  }, [repository]);

  useEffect(load, [load]);

  const clear = useCallback(async () => {
    await repository.clear();
    load();
  }, [repository, load]);

  return { state, reload: load, clear };
}
