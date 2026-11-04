import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { i18n, initI18n, LANGUAGE_STORAGE_KEY } from '@/i18n';
import { ALL_RESOURCES } from './i18n';

// findBy*/waitFor default to 1 s, which parallel runs occasionally exceed (see vite.config.ts).
configure({ asyncUtilTimeout: 3000 });

// Tests read the interface in English (the source language) unless they switch on purpose.
await initI18n({ language: 'en', resources: ALL_RESOURCES });

afterEach(async () => {
  cleanup();
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  if (i18n.language !== 'en') await i18n.changeLanguage('en');
});
