import { useCallback, useEffect, useState } from 'react';
import type { Repository } from '@/domain/storage';

export type StoredState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly value: T }
  | { readonly status: 'error' };

/** Loads one persisted slice; `update` applies a pure change and saves it. */
export function useStored<T>(repository: Repository<T>, empty: () => T) {
  const [state, setState] = useState<StoredState<T>>({ status: 'loading' });

  const load = useCallback(() => {
    repository
      .get()
      .then((value) => {
        setState({ status: 'ready', value: value ?? empty() });
      })
      .catch(() => {
        setState({ status: 'error' });
      });
  }, [repository, empty]);

  useEffect(load, [load]);

  /** Re-reads before writing so concurrent screens never overwrite each other's changes. */
  const update = useCallback(
    async (change: (current: T) => T) => {
      const next = change((await repository.get()) ?? empty());
      await repository.save(next);
      setState({ status: 'ready', value: next });
      return next;
    },
    [repository, empty],
  );

  return { state, reload: load, update };
}
