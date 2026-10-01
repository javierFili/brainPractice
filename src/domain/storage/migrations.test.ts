import { keepValid, keepValidEntries, migrate } from './migrations';

const isNumber = (value: unknown): value is number => typeof value === 'number';

describe('migrate', () => {
  const migrations = {
    1: (doc: Record<string, unknown>) => ({ ...doc, renamed: doc['old'], old: undefined }),
    2: (doc: Record<string, unknown>) => ({ ...doc, added: true }),
  };

  it('applies every step from the stored version to the current one, in order', () => {
    expect(migrate({ schemaVersion: 1, old: 'x' }, 3, migrations)).toEqual({
      ok: true,
      value: { schemaVersion: 3, renamed: 'x', old: undefined, added: true },
    });
  });

  it('returns current data unchanged', () => {
    expect(migrate({ schemaVersion: 3, a: 1 }, 3, migrations)).toEqual({
      ok: true,
      value: { schemaVersion: 3, a: 1 },
    });
  });

  it.each([
    [null, 'not-an-object'],
    [[], 'not-an-object'],
    [{}, 'missing-version'],
    [{ schemaVersion: 1.5 }, 'missing-version'],
    [{ schemaVersion: 4 }, 'from-the-future'],
  ])('refuses %j (%s)', (value, error) => {
    expect(migrate(value, 3, migrations)).toEqual({ ok: false, error });
  });

  it('refuses when a step is missing', () => {
    expect(migrate({ schemaVersion: 1 }, 3, { 2: migrations[2] })).toEqual({
      ok: false,
      error: 'no-path',
    });
  });
});

describe('keepValid / keepValidEntries', () => {
  it('keeps valid items and counts the rest', () => {
    const tally = { discarded: 0 };
    expect(keepValid([1, 'a', 2], isNumber, tally)).toEqual([1, 2]);
    expect(keepValid('nope', isNumber, tally)).toEqual([]);
    expect(keepValid(undefined, isNumber, tally)).toEqual([]);
    expect(tally.discarded).toBe(2);
  });

  it('filters record entries by key and value', () => {
    const tally = { discarded: 0 };
    const kept = keepValidEntries(
      { a: 1, b: 'x', c: 3 },
      (key, value): value is number => key !== 'c' && isNumber(value),
      tally,
    );
    expect(kept).toEqual({ a: 1 });
    expect(tally.discarded).toBe(2);
  });
});
