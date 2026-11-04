/*
 * Task names that do not imply an order on their own (no "deploy", no "serve dinner"): only the
 * listed needs decide what comes first, so world knowledge never answers the question.
 */
import { msg, type Message } from '@/domain/shared';

/**
 * Task names are stable English ids (they key the graph, the options and the solution); people
 * read them through `taskLabel`, so a language switch never changes which task is which.
 */
export const THEMES: readonly { readonly name: string; readonly tasks: readonly string[] }[] = [
  {
    name: 'monorepo',
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
    name: 'kitchen',
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
    name: 'release',
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

const keyOf = (id: string) => id.replace(/[^a-z]+/g, '_');

/** A task as people read it (no quotes): option labels, ordering items, the task list. */
export const taskLabel = (task: string): Message =>
  msg(`programming:dependencyOrdering.tasks.${keyOf(task)}`);

/** A task inside a sentence, quoted the way the reader's language quotes names. */
export const quotedTask = (task: string): Message =>
  msg('programming:dependencyOrdering.quoted', { task: taskLabel(task) });

/** The heading of a theme ("Kitchen prep"). */
export const themeLabel = (theme: string): Message =>
  msg(`programming:dependencyOrdering.themes.${theme}`);
