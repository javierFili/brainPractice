import { defaultPreferences, recoverPreferences, routeDefaults } from './preferences';

describe('preferences', () => {
  it('round-trips the defaults', () => {
    expect(recoverPreferences(defaultPreferences())).toEqual({
      value: defaultPreferences(),
      discarded: 0,
    });
  });

  it('keeps valid fields and resets invalid ones', () => {
    const recovered = recoverPreferences({
      ...defaultPreferences(),
      path: 'seniors',
      textSize: 'gigantic',
      dailyGoalMinutes: 10,
      freePlay: 'yes',
    });
    expect(recovered?.discarded).toBe(2);
    expect(recovered?.value).toMatchObject({
      path: 'seniors',
      textSize: 'normal',
      dailyGoalMinutes: 10,
      freePlay: false,
    });
  });

  it('fills fields missing from older documents with defaults', () => {
    expect(recoverPreferences({ schemaVersion: 1, comfort: true })?.value).toEqual({
      ...defaultPreferences(),
      comfort: true,
    });
  });

  it('refuses documents from a newer version', () => {
    expect(recoverPreferences({ schemaVersion: 99 })).toBeNull();
    expect(recoverPreferences('nope')).toBeNull();
  });

  it('suggests accessible defaults for the seniors route without touching difficulty', () => {
    expect(routeDefaults('seniors')).toEqual({
      textSize: 'large',
      comfort: true,
      relaxedByDefault: true,
    });
    expect(routeDefaults('adults')).toEqual({});
  });
});
