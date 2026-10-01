import type { Repository } from '@/domain/storage';

export class InMemoryRepository<T> implements Repository<T> {
  constructor(public stored: T | null = null) {}

  get() {
    return Promise.resolve(this.stored);
  }

  save(value: T) {
    this.stored = value;
    return Promise.resolve();
  }

  clear() {
    this.stored = null;
    return Promise.resolve();
  }
}
