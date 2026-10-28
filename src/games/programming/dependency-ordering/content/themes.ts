/**
 * Task names that do not imply an order on their own (no "deploy", no "serve dinner"): only the
 * listed needs decide what comes first, so world knowledge never answers the question.
 */
export const THEMES: readonly { readonly name: string; readonly tasks: readonly string[] }[] = [
  {
    name: 'Monorepo build',
    tasks: [
      'build core',
      'build utils',
      'build parser',
      'build router',
      'build charts',
      'build auth',
      'build forms',
      'build icons',
      'build api-client',
      'build themes',
    ],
  },
  {
    name: 'Kitchen prep',
    tasks: [
      'chop onions',
      'grate cheese',
      'toast seeds',
      'make sauce',
      'boil pasta',
      'wash lettuce',
      'slice tomatoes',
      'whisk eggs',
      'roast peppers',
      'mix dressing',
    ],
  },
  {
    name: 'Release checklist',
    tasks: [
      'update changelog',
      'bump version',
      'translate strings',
      'record demo',
      'review copy',
      'run audit',
      'refresh screenshots',
      'write notes',
      'check licences',
      'sign binaries',
    ],
  },
];
