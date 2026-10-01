import { applyLessonResult, emptyLearningProgress } from '@/domain/learning';
import { variablesLesson } from '@/test/fixtures/learningCourse';
import { MemoryStorage } from './browserStorage';
import {
  LocalStorageLearningRepository,
  LEARNING_STORAGE_KEY,
} from './LocalStorageLearningRepository';
import { PROGRESS_STORAGE_KEY } from './LocalStorageProgressRepository';

describe('LocalStorageLearningRepository', () => {
  it('round-trips learning progress under its own key', async () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageLearningRepository(storage);
    const progress = applyLessonResult(emptyLearningProgress(), variablesLesson, {
      lessonId: variablesLesson.id,
      outcomes: [],
      score: 1,
      passed: true,
      startedAt: 0,
      endedAt: 1,
    });
    await repository.save(progress);
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
    await expect(repository.get()).resolves.toEqual(progress);
  });

  it('isolates damage: corrupt learning data comes back empty and backed up', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storage = new MemoryStorage();
    storage.setItem(LEARNING_STORAGE_KEY, '{broken');
    const repository = new LocalStorageLearningRepository(storage);
    await expect(repository.get()).resolves.toBeNull();
    expect(storage.getItem(repository.backupKey)).toBe('{broken');
  });
});
