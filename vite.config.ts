import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    // UI flows with many user events run slower when every file runs in parallel; these margins
    // absorb scheduling noise without hiding real hangs.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      reporter: ['text', 'html'],
      // Pure layers carry the business rules; UI is measured by covered flows instead (TESTING.md).
      thresholds: {
        'src/domain/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/engine/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
      },
    },
  },
});
