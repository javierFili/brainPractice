import { applySessionResult, emptyProgress } from '@/domain/progress';
import { resultFixture } from '@/test/fixtures/results';
import {
  LocalStorageProgressRepository,
  PROGRESS_STORAGE_KEY,
} from './LocalStorageProgressRepository';
import { MemoryStorage } from './browserStorage';

describe('LocalStorageProgressRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips progress', async () => {
    const repository = new LocalStorageProgressRepository(localStorage);
    const progress = applySessionResult(emptyProgress(), resultFixture());
    await repository.save(progress);
    await expect(repository.get()).resolves.toEqual(progress);
    await repository.clear();
    await expect(repository.get()).resolves.toBeNull();
  });

  it.each(['{not json', JSON.stringify({ schemaVersion: 99 })])(
    'treats unrecoverable data %j as empty, keeping a backup of the original',
    async (raw) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      localStorage.setItem(PROGRESS_STORAGE_KEY, raw);
      const repository = new LocalStorageProgressRepository(localStorage);
      await expect(repository.get()).resolves.toBeNull();
      expect(localStorage.getItem(repository.backupKey)).toBe(raw);
      expect(warn).toHaveBeenCalledOnce();
    },
  );

  it('recovers the valid entries when only some are damaged, and backs up the original', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const progress = applySessionResult(emptyProgress(), resultFixture());
    const damaged = {
      ...progress,
      recentSessions: [...progress.recentSessions, { gameId: 42 }],
      games: { ...progress.games, broken: { 3: { plays: 'many' } } },
    };
    const raw = JSON.stringify(damaged);
    localStorage.setItem(PROGRESS_STORAGE_KEY, raw);
    const repository = new LocalStorageProgressRepository(localStorage);

    await expect(repository.get()).resolves.toEqual(progress);
    expect(localStorage.getItem(repository.backupKey)).toBe(raw);
  });

  it('rejects instead of throwing when storage access itself fails', async () => {
    const blocked = new MemoryStorage();
    blocked.getItem = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    await expect(new LocalStorageProgressRepository(blocked).get()).rejects.toThrow('denied');
  });

  it('reports storage failures instead of hiding them', async () => {
    const failing: Storage = {
      length: 0,
      clear: () => undefined,
      getItem: () => null,
      key: () => null,
      removeItem: () => undefined,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    };
    await expect(new LocalStorageProgressRepository(failing).save(emptyProgress())).rejects.toThrow(
      'full',
    );
  });
});
