import type { Clock } from '@/domain/time/Clock';

/** Manually advanced clock for deterministic timing tests. */
export class FakeClock implements Clock {
  constructor(private current = 1_000) {}

  now(): number {
    return this.current;
  }

  advance(ms: number): void {
    if (ms < 0) throw new RangeError('FakeClock cannot go backwards');
    this.current += ms;
  }
}
