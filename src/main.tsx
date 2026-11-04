import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { cryptoSeedSource } from '@/infrastructure/CryptoSeedSource';
import { openBrowserStorage } from '@/infrastructure/browserStorage';
import { LocalStorageLearningRepository } from '@/infrastructure/LocalStorageLearningRepository';
import { LocalStoragePreferencesRepository } from '@/infrastructure/LocalStoragePreferencesRepository';
import { LocalStorageProfileRepository } from '@/infrastructure/LocalStorageProfileRepository';
import { LocalStorageProgressRepository } from '@/infrastructure/LocalStorageProgressRepository';
import { systemClock } from '@/infrastructure/SystemClock';
import {
  browserLanguages,
  browserLanguageStorage,
  detectLanguage,
  initI18n,
  readStoredLanguage,
} from '@/i18n';
import './index.css';

// The app and its 60 games load as a separate chunk, so the page paints its loading state first.
// The interface language loads alongside, so the first render is already translated.
const [{ App }, { createServices }, { GAME_MODULES }] = await Promise.all([
  import('@/app/App'),
  import('@/app/composition'),
  import('@/games/registry'),
  initI18n({
    language: detectLanguage(readStoredLanguage(browserLanguageStorage()), browserLanguages()),
  }),
]);

const { storage, persistence } = openBrowserStorage();
const services = createServices({
  modules: GAME_MODULES,
  clock: systemClock,
  seeds: cryptoSeedSource,
  progress: new LocalStorageProgressRepository(storage),
  loadCourse: () => import('@/content/programming-logic/course').then((m) => m.PROGRAMMING_LOGIC),
  learning: new LocalStorageLearningRepository(storage),
  profile: new LocalStorageProfileRepository(storage),
  preferences: new LocalStoragePreferencesRepository(storage),
  persistence,
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <App services={services} />
  </StrictMode>,
);
