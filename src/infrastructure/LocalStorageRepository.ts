import type { Recovered, Repository } from '@/domain/storage';

/**
 * One persisted slice in a Storage. Damaged data is never silently lost: `recover` salvages what
 * can be trusted, and the original text is copied to `<key>:backup` before anything overwrites it.
 * Storage failures (blocked storage, private mode, quota) are reported as rejections, never thrown.
 */
export class LocalStorageRepository<T> implements Repository<T> {
  constructor(
    private readonly storage: Storage,
    private readonly key: string,
    private readonly recover: (value: unknown) => Recovered<T> | null,
  ) {}

  get backupKey(): string {
    return `${this.key}:backup`;
  }

  get(): Promise<T | null> {
    try {
      const raw = this.storage.getItem(this.key);
      if (raw === null) return Promise.resolve(null);
      const recovered = this.recover(parse(raw));
      if (recovered?.discarded === 0) return Promise.resolve(recovered.value);
      this.storage.setItem(this.backupKey, raw);
      console.warn(
        recovered
          ? `[storage] Dropped ${recovered.discarded} damaged entries under "${this.key}"; original kept in "${this.backupKey}"`
          : `[storage] Unreadable data under "${this.key}"; original kept in "${this.backupKey}"`,
      );
      return Promise.resolve(recovered?.value ?? null);
    } catch (error) {
      return Promise.reject(asError(error));
    }
  }

  save(value: T): Promise<void> {
    try {
      this.storage.setItem(this.key, JSON.stringify(value));
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
}

function parse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const asError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));
