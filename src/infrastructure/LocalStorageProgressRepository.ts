import { recoverUserProgress, type ProgressRepository, type UserProgress } from '@/domain/progress';

export const PROGRESS_STORAGE_KEY = 'brain-practice:progress';

/**
 * Temporary persistence for the demo. Damaged data is never silently lost: valid entries are
 * recovered, and the original text is copied to `<key>:backup` before anything overwrites it.
 * Storage failures (blocked storage, private mode, quota) are reported as rejections, not thrown.
 */
export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(
    private readonly storage: Storage,
    private readonly key = PROGRESS_STORAGE_KEY,
  ) {}

  get backupKey(): string {
    return `${this.key}:backup`;
  }

  get(): Promise<UserProgress | null> {
    try {
      const raw = this.storage.getItem(this.key);
      if (raw === null) return Promise.resolve(null);
      const recovered = recoverUserProgress(this.parse(raw));
      if (recovered?.discarded === 0) return Promise.resolve(recovered.progress);
      this.storage.setItem(this.backupKey, raw);
      console.warn(
        recovered
          ? `[progress] Dropped ${recovered.discarded} damaged entries under "${this.key}"; original kept in "${this.backupKey}"`
          : `[progress] Unreadable progress under "${this.key}"; original kept in "${this.backupKey}"`,
      );
      return Promise.resolve(recovered?.progress ?? null);
    } catch (error) {
      return Promise.reject(asError(error));
    }
  }

  save(progress: UserProgress): Promise<void> {
    try {
      this.storage.setItem(this.key, JSON.stringify(progress));
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(asError(error));
    }
  }

  clear(): Promise<void> {
    try {
      this.storage.removeItem(this.key);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(asError(error));
    }
  }

  private parse(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

const asError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));
