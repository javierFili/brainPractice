/** A Storage kept in memory: progress lasts for the tab's lifetime only. */
export class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

export type Persistence = 'device' | 'session-only';

/**
 * `window.localStorage` throws on access when storage is blocked (e.g. Safari with cookies
 * disabled, sandboxed iframes). Probe it once and fall back to memory so the app still works.
 */
export function openBrowserStorage(access: () => Storage = () => window.localStorage): {
  storage: Storage;
  persistence: Persistence;
} {
  try {
    const storage = access();
    const probe = 'brain-practice:probe';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return { storage, persistence: 'device' };
  } catch {
    return { storage: new MemoryStorage(), persistence: 'session-only' };
  }
}
