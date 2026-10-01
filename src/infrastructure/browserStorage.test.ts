import { MemoryStorage, openBrowserStorage } from './browserStorage';

describe('openBrowserStorage', () => {
  it('uses the real storage when it works', () => {
    expect(openBrowserStorage(() => localStorage)).toEqual({
      storage: localStorage,
      persistence: 'device',
    });
  });

  it('falls back to memory when accessing storage throws', () => {
    const { storage, persistence } = openBrowserStorage(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(persistence).toBe('session-only');
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
  });

  it('falls back to memory when writes are refused', () => {
    const readOnly = new MemoryStorage();
    readOnly.setItem = () => {
      throw new DOMException('full', 'QuotaExceededError');
    };
    expect(openBrowserStorage(() => readOnly).persistence).toBe('session-only');
  });
});
