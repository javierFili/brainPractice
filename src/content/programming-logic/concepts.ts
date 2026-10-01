import { conceptId, type Concept } from '@/domain/learning';

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
    name: 'Programs',
    summary: 'A program is a precise list of instructions that a computer follows literally.',
    cognitiveLinks: [
      {
        area: 'attention',
        gameId: 'bug-hunter',
        level: 1,
        why: 'Computers act on every detail, so reading instructions precisely matters.',
      },
    ],
  },
  {
    id: C.sequence,
    name: 'Sequence',
    summary: 'Instructions run one after another, top to bottom; order changes the result.',
    cognitiveLinks: [
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 1,
        why: 'Ordering tasks by their dependencies is the same skill as ordering instructions.',
      },
      {
        area: 'memory',
        gameId: 'code-memory',
        level: 1,
        why: 'Remembering what happened in which order is how you follow a sequence.',
      },
    ],
  },
  {
    id: C.variables,
    name: 'Variables',
    summary: 'Names that hold values; assignment stores a new value and replaces the old one.',
    cognitiveLinks: [
      {
        area: 'memory',
        gameId: 'code-memory',
        level: 2,
        why: 'Tracing code means holding the current value of each variable in mind.',
      },
      {
        area: 'speed',
        gameId: 'code-scan',
        level: 1,
        why: 'Spotting which value changed between two lines quickly.',
      },
    ],
  },
  {
    id: C.conditions,
    name: 'Conditions',
    summary: 'if / elif / else choose exactly one path depending on a true/false question.',
    cognitiveLinks: [
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 2,
        why: 'Predicting which branch a program takes is trained directly there.',
      },
      {
        area: 'attention',
        gameId: 'bug-hunter',
        level: 2,
        why: 'Boundary values (>= vs >) are exactly the details that hide bugs.',
      },
    ],
  },
  {
    id: C.booleanLogic,
    name: 'Logical operators',
    summary: 'and, or and not combine true/false questions into one.',
    cognitiveLinks: [
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 4,
        why: 'Constraint puzzles are combinations of and / or / not rules.',
      },
      {
        area: 'patterns',
        gameId: 'pattern-architect',
        level: 2,
        why: 'Seeing which rule fits all the examples is how you design a condition.',
      },
    ],
  },
  {
    id: C.loops,
    name: 'Loops',
    summary: 'while and for repeat a block; a loop needs a way to stop.',
    cognitiveLinks: [
      {
        area: 'memory',
        gameId: 'code-memory',
        level: 3,
        why: 'Following a loop means updating values in your head on every pass.',
      },
      {
        area: 'patterns',
        gameId: 'pattern-architect',
        level: 3,
        why: 'A loop is a repeated pattern; spotting the rule tells you the body.',
      },
    ],
  },
  {
    id: C.lists,
    name: 'Lists',
    summary: 'Ordered collections of values, read by position starting at 0.',
    cognitiveLinks: [
      {
        area: 'memory',
        gameId: 'code-memory',
        level: 4,
        why: 'Remembering positions in a structure is the core of indexing.',
      },
      {
        area: 'attention',
        gameId: 'bug-hunter',
        level: 3,
        why: 'Off-by-one positions are the classic list mistake.',
      },
    ],
  },
  {
    id: C.functions,
    name: 'Functions',
    summary: 'Named, reusable steps with parameters in and a return value out.',
    cognitiveLinks: [
      {
        area: 'patterns',
        gameId: 'pattern-architect',
        level: 4,
        why: 'Inferring a transformation from input/output examples is what a function is.',
      },
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 3,
        why: 'Tracing a call means following values into and out of a block.',
      },
    ],
  },
  {
    id: C.decomposition,
    name: 'Decomposition',
    summary: 'Breaking a problem into smaller steps with clear inputs and outputs.',
    cognitiveLinks: [
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 5,
        why: 'Dependency graphs show which sub-task must be done before which.',
      },
    ],
  },
  {
    id: C.algorithms,
    name: 'Algorithms',
    summary: 'Step-by-step recipes such as counting, summing, finding the largest, searching.',
    cognitiveLinks: [
      {
        area: 'patterns',
        gameId: 'pattern-architect',
        level: 5,
        why: 'Recognising a familiar algorithmic shape (accumulate, search, compare) in new code.',
      },
      {
        area: 'logic',
        gameId: 'algorithmic-logic',
        level: 6,
        why: 'Reasoning about the minimum steps needed is the start of complexity.',
      },
    ],
  },
  {
    id: C.debugging,
    name: 'Debugging',
    summary: 'Finding why a program does not do what it should: trace, compare, form a hypothesis.',
    cognitiveLinks: [
      {
        area: 'attention',
        gameId: 'bug-hunter',
        level: 3,
        why: 'Finding the one line that breaks a rule is debugging in miniature.',
      },
      {
        area: 'speed',
        gameId: 'code-scan',
        level: 3,
        why: 'Comparing what the code does with what it should do, quickly.',
      },
    ],
  },
];
