import { isUserProgress, type ProgressRepository, type UserProgress } from '@/domain/progress';

export const PROGRESS_STORAGE_KEY = 'brain-practice:progress';

/**
 * Temporary persistence for the demo. Corrupt or outdated data is discarded with a warning
 * instead of crashing the app; storage failures (private mode, quota) are reported, not hidden.
 */
export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(
    private readonly storage: Storage,
    private readonly key = PROGRESS_STORAGE_KEY,
  ) {}

  get(): Promise<UserProgress | null> {
    const raw = this.storage.getItem(this.key);
    if (raw === null) return Promise.resolve(null);
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isUserProgress(parsed)) return Promise.resolve(parsed);
    } catch {
      // fall through: invalid JSON is treated like invalid shape
    }
    console.warn(`[progress] Discarding unreadable progress stored under "${this.key}"`);
    return Promise.resolve(null);
  }

  save(progress: UserProgress): Promise<void> {
    try {
      this.storage.setItem(this.key, JSON.stringify(progress));
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  clear(): Promise<void> {
    this.storage.removeItem(this.key);
    return Promise.resolve();
  }
}
