import { recoverUserProgress, type UserProgress } from '@/domain/progress';
import { LocalStorageRepository } from './LocalStorageRepository';

export const PROGRESS_STORAGE_KEY = 'brain-practice:progress';

/** Game and assessment progress (see LocalStorageRepository for the recovery guarantees). */
export class LocalStorageProgressRepository extends LocalStorageRepository<UserProgress> {
  constructor(storage: Storage, key = PROGRESS_STORAGE_KEY) {
    super(storage, key, recoverUserProgress);
  }
}
