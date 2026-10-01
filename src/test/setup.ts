import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// findBy*/waitFor default to 1 s, which parallel runs occasionally exceed (see vite.config.ts).
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
  cleanup();
});
