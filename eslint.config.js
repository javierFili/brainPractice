// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Layers that must stay framework-agnostic (see ARCHITECTURE.md §3). */
const PURE_LAYERS = ['src/domain/**', 'src/engine/**', 'src/games/**/content/**'];

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: PURE_LAYERS,
    // Tests may measure real time (e.g. generation speed budgets); production code may not.
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react-router', 'react/*'],
              message: 'Pure layers must not depend on React.',
            },
            {
              group: ['@/app/*', '@/features/*', '@/components/*', '@/infrastructure/*'],
              message: 'Pure layers must not depend on outer layers.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: 'Use a repository port.' },
        { name: 'window', message: 'Pure layers must not touch the DOM.' },
        { name: 'document', message: 'Pure layers must not touch the DOM.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Inject a RandomGenerator.' },
        { object: 'Date', property: 'now', message: 'Inject a Clock.' },
        { object: 'performance', property: 'now', message: 'Inject a Clock.' },
      ],
    },
  },
  { files: ['*.js'], extends: [tseslint.configs.disableTypeChecked] },
  prettier,
);
