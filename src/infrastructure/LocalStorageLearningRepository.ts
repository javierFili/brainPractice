import { recoverLearningProgress, type LearningProgress } from '@/domain/learning';
import { LocalStorageRepository } from './LocalStorageRepository';

export const LEARNING_STORAGE_KEY = 'brain-practice:learning';

/** Its own key and schema version: damaged learning data never touches game progress, and vice versa. */
export class LocalStorageLearningRepository extends LocalStorageRepository<LearningProgress> {
  constructor(storage: Storage, key = LEARNING_STORAGE_KEY) {
    super(storage, key, recoverLearningProgress);
  }
}
