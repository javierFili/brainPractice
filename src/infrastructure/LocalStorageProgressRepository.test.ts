import { applySessionResult, emptyProgress } from '@/domain/progress';
import { resultFixture } from '@/test/fixtures/results';
import {
  LocalStorageProgressRepository,
  PROGRESS_STORAGE_KEY,
} from './LocalStorageProgressRepository';

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
    'discards unreadable data %j with a warning',
    async (raw) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      localStorage.setItem(PROGRESS_STORAGE_KEY, raw);
      await expect(new LocalStorageProgressRepository(localStorage).get()).resolves.toBeNull();
      expect(warn).toHaveBeenCalledOnce();
    },
  );

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
