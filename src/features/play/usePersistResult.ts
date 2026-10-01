import { useEffect, useRef, useState } from 'react';
import { applySessionResult, emptyProgress, type ProgressRepository } from '@/domain/progress';
import type { GameResult } from '@/domain/session';

export type PersistStatus = 'idle' | 'saving' | 'saved' | 'failed';

/** Re-reads, applies and saves: the one way a finished session reaches storage. */
export async function saveSessionResult(
  repository: ProgressRepository,
  result: GameResult,
): Promise<void> {
  const progress = await repository.get();
  await repository.save(applySessionResult(progress ?? emptyProgress(), result));
}

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
    saveSessionResult(repository, result)
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
