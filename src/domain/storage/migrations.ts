import { err, ok, type Result } from '../shared/result';

export type JsonObject = Record<string, unknown>;

/** Upgrades a persisted document from version `n` to `n + 1`. Must be pure. */
export type Migration = (document: JsonObject) => JsonObject;

export type MigrationError = 'not-an-object' | 'missing-version' | 'from-the-future' | 'no-path';

export const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Brings untrusted persisted data up to `current` by applying `migrations[v]` for every version
 * between the stored one and `current`. Data from a newer app version is refused, not guessed at.
 */
export function migrate(
  value: unknown,
  current: number,
  migrations: Readonly<Partial<Record<number, Migration>>>,
): Result<JsonObject, MigrationError> {
  if (!isJsonObject(value)) return err('not-an-object');
  const version = value['schemaVersion'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1)
    return err('missing-version');
  if (version > current) return err('from-the-future');
  let document = value;
  for (let v = version; v < current; v++) {
    const step = migrations[v];
    if (!step) return err('no-path');
    document = { ...step(document), schemaVersion: v + 1 };
  }
  return ok(document);
}

/** Result of reading a persisted slice: what could be trusted and how much had to be dropped. */
export interface Recovered<T> {
  readonly value: T;
  /** Entries dropped because they were malformed; 0 means the data was intact. */
  readonly discarded: number;
}

/**
 * Keeps the elements of `items` that pass `guard`, counting the rest into `tally`. A non-array
 * counts as one discarded entry (unless absent).
 */
export function keepValid<T>(
  items: unknown,
  guard: (item: unknown) => item is T,
  tally: { discarded: number },
): T[] {
  if (!Array.isArray(items)) {
    if (items !== undefined) tally.discarded++;
    return [];
  }
  const valid = items.filter(guard);
  tally.discarded += items.length - valid.length;
  return valid;
}

/** Same as `keepValid` for string-keyed records. */
export function keepValidEntries<T>(
  record: unknown,
  guard: (key: string, value: unknown) => value is T,
  tally: { discarded: number },
): Record<string, T> {
  if (!isJsonObject(record)) {
    if (record !== undefined) tally.discarded++;
    return {};
  }
  const kept: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (guard(key, value)) kept[key] = value;
    else tally.discarded++;
  }
  return kept;
}
