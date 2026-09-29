import type { ProgressRepository, UserProgress } from '@/domain/progress';

export class InMemoryProgressRepository implements ProgressRepository {
  constructor(public stored: UserProgress | null = null) {}

  get() {
    return Promise.resolve(this.stored);
  }

  save(progress: UserProgress) {
    this.stored = progress;
    return Promise.resolve();
  }

  clear() {
    this.stored = null;
    return Promise.resolve();
  }
}
