/**
 * Port for one persisted slice of user data (game progress, learning progress, profile). The domain
 * never knows where it lives: localStorage today, an API later.
 */
export interface Repository<T> {
  get(): Promise<T | null>;
  save(value: T): Promise<void>;
  clear(): Promise<void>;
}
