import { recoverProfile, type UserProfile } from '@/domain/profile';
import { LocalStorageRepository } from './LocalStorageRepository';

export const PROFILE_STORAGE_KEY = 'brain-practice:profile';

export class LocalStorageProfileRepository extends LocalStorageRepository<UserProfile> {
  constructor(storage: Storage, key = PROFILE_STORAGE_KEY) {
    super(storage, key, recoverProfile);
  }
}
