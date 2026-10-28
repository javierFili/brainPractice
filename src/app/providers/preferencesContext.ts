import { createContext, useContext } from 'react';
import { defaultPreferences, type Preferences } from '@/domain/preferences';

export interface PreferencesValue {
  readonly preferences: Preferences;
  /** False until stored preferences are read; defaults are used meanwhile. */
  readonly ready: boolean;
  readonly update: (change: Partial<Preferences>) => void;
}

export const PreferencesContext = createContext<PreferencesValue>({
  preferences: defaultPreferences(),
  ready: false,
  update: () => undefined,
});

export const usePreferences = () => useContext(PreferencesContext);
