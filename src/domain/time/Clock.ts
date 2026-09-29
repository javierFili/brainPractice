/**
 * Monotonic, high-resolution time source in milliseconds.
 * Domain logic never reads the system time directly; tests inject a controllable clock.
 */
export interface Clock {
  now(): number;
}
