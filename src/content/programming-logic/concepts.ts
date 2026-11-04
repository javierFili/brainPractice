import { conceptId, type Concept } from '@/domain/learning';
import { msg } from '@/domain/shared';

/** Concept ids of Programming Logic, shared by lessons, reviews and recommendations. */
export const C = {
  programs: conceptId('programs'),
  sequence: conceptId('sequence'),
  variables: conceptId('variables'),
  conditions: conceptId('conditions'),
  booleanLogic: conceptId('boolean-logic'),
  loops: conceptId('loops'),
  lists: conceptId('lists'),
  functions: conceptId('functions'),
  decomposition: conceptId('decomposition'),
  algorithms: conceptId('algorithms'),
  debugging: conceptId('debugging'),
} as const;

/**
 * Each concept names the cognitive training that supports it (TRAIN ↔ LEARN). The links are
 * practice suggestions, not claims that a game causes learning.
 */
export const CONCEPTS: readonly Concept[] = [
  {
    id: C.programs,
    name: msg('lessons:concepts.programs.name'),
    summary: msg('lessons:concepts.programs.summary'),
    cognitiveLinks: [
      {
        area: 'attention',
        gameId: 'bug-hunter',
        level: 1,
        why: msg('lessons:concepts.programs.why.bug-hunter'),
      },
    ],
  },
  {
    id: C.sequence,
    name: msg('lessons:concepts.sequence.name'),
    summary: msg('lessons:concepts.sequence.summary'),
    cognitiveLinks: [
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 1,
        why: msg('lessons:concepts.sequence.why.algorithmic-logic'),
      },
      {
        area: 'memory',
        gameId: 'code-memory',
        level: 1,
        why: msg('lessons:concepts.sequence.why.code-memory'),
      },
    ],
  },
  {
    id: C.variables,
    name: msg('lessons:concepts.variables.name'),
    summary: msg('lessons:concepts.variables.summary'),
    cognitiveLinks: [
      {
        area: 'memory',
        gameId: 'code-memory',
        level: 2,
        why: msg('lessons:concepts.variables.why.code-memory'),
      },
      {
        area: 'speed',
        gameId: 'code-scan',
        level: 1,
        why: msg('lessons:concepts.variables.why.code-scan'),
      },
    ],
  },
  {
    id: C.conditions,
    name: msg('lessons:concepts.conditions.name'),
    summary: msg('lessons:concepts.conditions.summary'),
    cognitiveLinks: [
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 2,
        why: msg('lessons:concepts.conditions.why.algorithmic-logic'),
      },
      {
        area: 'attention',
        gameId: 'bug-hunter',
        level: 2,
        why: msg('lessons:concepts.conditions.why.bug-hunter'),
      },
    ],
  },
  {
    id: C.booleanLogic,
    name: msg('lessons:concepts.boolean-logic.name'),
    summary: msg('lessons:concepts.boolean-logic.summary'),
    cognitiveLinks: [
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 4,
        why: msg('lessons:concepts.boolean-logic.why.algorithmic-logic'),
      },
      {
        area: 'patterns',
        gameId: 'pattern-architect',
        level: 2,
        why: msg('lessons:concepts.boolean-logic.why.pattern-architect'),
      },
    ],
  },
  {
    id: C.loops,
    name: msg('lessons:concepts.loops.name'),
    summary: msg('lessons:concepts.loops.summary'),
    cognitiveLinks: [
      {
        area: 'memory',
        gameId: 'code-memory',
        level: 3,
        why: msg('lessons:concepts.loops.why.code-memory'),
      },
      {
        area: 'patterns',
        gameId: 'pattern-architect',
        level: 3,
        why: msg('lessons:concepts.loops.why.pattern-architect'),
      },
    ],
  },
  {
    id: C.lists,
    name: msg('lessons:concepts.lists.name'),
    summary: msg('lessons:concepts.lists.summary'),
    cognitiveLinks: [
      {
        area: 'memory',
        gameId: 'code-memory',
        level: 4,
        why: msg('lessons:concepts.lists.why.code-memory'),
      },
      {
        area: 'attention',
        gameId: 'bug-hunter',
        level: 3,
        why: msg('lessons:concepts.lists.why.bug-hunter'),
      },
    ],
  },
  {
    id: C.functions,
    name: msg('lessons:concepts.functions.name'),
    summary: msg('lessons:concepts.functions.summary'),
    cognitiveLinks: [
      {
        area: 'patterns',
        gameId: 'pattern-architect',
        level: 4,
        why: msg('lessons:concepts.functions.why.pattern-architect'),
      },
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 3,
        why: msg('lessons:concepts.functions.why.algorithmic-logic'),
      },
    ],
  },
  {
    id: C.decomposition,
    name: msg('lessons:concepts.decomposition.name'),
    summary: msg('lessons:concepts.decomposition.summary'),
    cognitiveLinks: [
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 5,
        why: msg('lessons:concepts.decomposition.why.algorithmic-logic'),
      },
    ],
  },
  {
    id: C.algorithms,
    name: msg('lessons:concepts.algorithms.name'),
    summary: msg('lessons:concepts.algorithms.summary'),
    cognitiveLinks: [
      {
        area: 'patterns',
        gameId: 'pattern-architect',
        level: 5,
        why: msg('lessons:concepts.algorithms.why.pattern-architect'),
      },
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 6,
        why: msg('lessons:concepts.algorithms.why.algorithmic-logic'),
      },
    ],
  },
  {
    id: C.debugging,
    name: msg('lessons:concepts.debugging.name'),
    summary: msg('lessons:concepts.debugging.summary'),
    cognitiveLinks: [
      {
        area: 'attention',
        gameId: 'bug-hunter',
        level: 3,
        why: msg('lessons:concepts.debugging.why.bug-hunter'),
      },
      {
        area: 'speed',
        gameId: 'code-scan',
        level: 3,
        why: msg('lessons:concepts.debugging.why.code-scan'),
      },
    ],
  },
];
