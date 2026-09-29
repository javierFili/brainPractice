import { DomainError } from '../shared/errors';
import { err, ok, type Result } from '../shared/result';

declare const brand: unique symbol;

/** Unsigned 32-bit integer used to seed deterministic generation. */
export type Seed = number & { readonly [brand]: 'Seed' };

export const MAX_SEED = 0xffffffff;

export interface InvalidSeedIssue {
  readonly code: 'INVALID_SEED';
  readonly input: unknown;
}

/**
 * Accepts integers in [0, 2^32 − 1] or their canonical decimal string (as found in a URL).
 * Rejects anything that would otherwise be coerced silently (`''`, `'1e3'`, `' 7'`, `1.5`, `NaN`).
 */
export function parseSeed(input: unknown): Result<Seed, InvalidSeedIssue> {
  const value =
    typeof input === 'string' && /^(0|[1-9]\d{0,9})$/.test(input) ? Number(input) : input;
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_SEED) {
    return ok(value as Seed);
  }
  return err({ code: 'INVALID_SEED', input });
}

export class InvalidSeedError extends DomainError {
  constructor(input: unknown) {
    super('INVALID_SEED', `Seed must be an integer in [0, ${MAX_SEED}], got ${String(input)}`);
  }
}

export function toSeed(input: unknown): Seed {
  const parsed = parseSeed(input);
  if (!parsed.ok) throw new InvalidSeedError(input);
  return parsed.value;
}

/**
 * Derives an independent child seed (e.g. challenge `index` of a session) with a murmur3-style
 * finaliser, so neighbouring indices produce uncorrelated streams.
 */
export function deriveSeed(parent: Seed, index: number): Seed {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError(`index must be a non-negative integer, got ${index}`);
  }
  let h = (parent ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) as Seed;
}
