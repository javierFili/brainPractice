import { recoverPreferences, type Preferences } from '@/domain/preferences';
import { LocalStorageRepository } from './LocalStorageRepository';

export const PREFERENCES_STORAGE_KEY = 'brain-practice:preferences';

export class LocalStoragePreferencesRepository extends LocalStorageRepository<Preferences> {
  constructor(storage: Storage, key = PREFERENCES_STORAGE_KEY) {
    super(storage, key, recoverPreferences);
  }
}
