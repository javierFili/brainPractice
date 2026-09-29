import { useEffect, useRef, useState } from 'react';
import { applySessionResult, emptyProgress, type ProgressRepository } from '@/domain/progress';
import type { GameResult } from '@/domain/session';

export type PersistStatus = 'idle' | 'saving' | 'saved' | 'failed';

/** Saves a finished session exactly once and reports the outcome. */
export function usePersistResult(
  result: GameResult | null,
  repository: ProgressRepository,
): PersistStatus {
  const [status, setStatus] = useState<PersistStatus>('idle');
  const saved = useRef<GameResult | null>(null);

  useEffect(() => {
    if (result === null || saved.current === result) return;
    saved.current = result;
    setStatus('saving');
    repository
      .get()
      .then((progress) => repository.save(applySessionResult(progress ?? emptyProgress(), result)))
      .then(() => {
        setStatus('saved');
      })
      .catch((error: unknown) => {
        console.error('[progress] Could not save the session result', error);
        setStatus('failed');
      });
  }, [result, repository]);

  return status;
}
