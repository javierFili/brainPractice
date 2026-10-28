import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { defaultPreferences, type Preferences } from '@/domain/preferences';
import { useServices } from './servicesContext';
import { PreferencesContext } from './preferencesContext';

/** Applies the display preferences to <html>, where the CSS tokens read them. */
function applyToDocument(preferences: Preferences) {
  const root = document.documentElement;
  root.dataset['textSize'] = preferences.textSize;
  root.dataset['motion'] = preferences.motion;
  root.dataset['comfort'] = preferences.comfort ? 'on' : 'off';
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { preferences: repository } = useServices();
  const [state, setState] = useState<{ value: Preferences; ready: boolean }>({
    value: defaultPreferences(),
    ready: false,
  });

  useEffect(() => {
    let active = true;
    repository
      .get()
      .then((stored) => {
        if (active) setState({ value: stored ?? defaultPreferences(), ready: true });
      })
      .catch((error: unknown) => {
        console.error('[preferences] Could not load preferences', error);
        if (active) setState((current) => ({ ...current, ready: true }));
      });
    return () => {
      active = false;
    };
  }, [repository]);

  const latest = useRef(state.value);
  useEffect(() => {
    latest.current = state.value;
    applyToDocument(state.value);
  }, [state.value]);

  const update = useCallback(
    (change: Partial<Preferences>) => {
      const next = { ...latest.current, ...change };
      latest.current = next;
      setState((current) => ({ value: next, ready: current.ready }));
      repository.save(next).catch((error: unknown) => {
        console.error('[preferences] Could not save preferences', error);
      });
    },
    [repository],
  );

  const value = useMemo(
    () => ({ preferences: state.value, ready: state.ready, update }),
    [state, update],
  );
  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}
