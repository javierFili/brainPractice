import type { Clock } from '@/domain/time/Clock';

/**
 * Monotonic and high resolution (performance.now) yet expressed as epoch milliseconds
 * (timeOrigin), so the same values can be persisted as timestamps.
 */
export const systemClock: Clock = {
  now: () => performance.timeOrigin + performance.now(),
};
