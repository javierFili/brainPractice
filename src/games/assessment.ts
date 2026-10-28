import type { AssessmentDefinition } from '@/domain/assessment';

/**
 * Assessment protocols. Each one is a fixed battery: same games, same levels and the same number
 * of challenges every time, so results of the same protocol are comparable with each other (and
 * only with each other). Recreational performance profiles, not psychometric instruments.
 */
export const COGNITIVE_ASSESSMENT_QUICK: AssessmentDefinition = {
  id: 'cognitive-assessment-quick-v1',
  name: 'Cognitive Assessment · quick',
  sections: [
    { area: 'memory', gameId: 'sequence-recall', levels: [2, 5, 8], challengesPerLevel: 1 },
    { area: 'logic', gameId: 'number-sequences', levels: [2, 5, 8], challengesPerLevel: 1 },
    { area: 'attention', gameId: 'odd-one-out', levels: [2, 5, 8], challengesPerLevel: 1 },
    { area: 'speed', gameId: 'number-comparison', levels: [2, 5, 8], challengesPerLevel: 2 },
    { area: 'patterns', gameId: 'matrix-reasoning', levels: [2, 5, 8], challengesPerLevel: 1 },
  ],
};

export const COGNITIVE_ASSESSMENT_STANDARD: AssessmentDefinition = {
  id: 'cognitive-assessment-standard-v1',
  name: 'Cognitive Assessment · standard',
  sections: [
    { area: 'memory', gameId: 'sequence-recall', levels: [2, 5, 8], challengesPerLevel: 2 },
    { area: 'memory', gameId: 'position-memory', levels: [3, 6], challengesPerLevel: 2 },
    { area: 'logic', gameId: 'number-sequences', levels: [2, 5, 8], challengesPerLevel: 2 },
    { area: 'attention', gameId: 'odd-one-out', levels: [2, 5, 8], challengesPerLevel: 2 },
    { area: 'speed', gameId: 'number-comparison', levels: [2, 5, 8], challengesPerLevel: 3 },
    { area: 'patterns', gameId: 'matrix-reasoning', levels: [2, 5, 8], challengesPerLevel: 2 },
    { area: 'patterns', gameId: 'shape-rotation', levels: [3, 6], challengesPerLevel: 2 },
  ],
};

/**
 * Programming Cognitive Assessment: every area sampled at a fundamentals, an intermediate and an
 * advanced level with two challenges each (30 challenges).
 */
export const PROGRAMMING_ASSESSMENT: AssessmentDefinition = {
  id: 'programming-cognitive-assessment-v1',
  name: 'Programming Cognitive Assessment',
  sections: [
    { area: 'logic', gameId: 'algorithmic-logic', levels: [2, 5, 8], challengesPerLevel: 2 },
    { area: 'memory', gameId: 'code-memory', levels: [2, 5, 8], challengesPerLevel: 2 },
    { area: 'speed', gameId: 'code-scan', levels: [2, 5, 8], challengesPerLevel: 2 },
    { area: 'attention', gameId: 'bug-hunter', levels: [2, 5, 8], challengesPerLevel: 2 },
    { area: 'patterns', gameId: 'pattern-architect', levels: [2, 5, 8], challengesPerLevel: 2 },
  ],
};

export interface AssessmentProtocol {
  readonly definition: AssessmentDefinition;
  readonly title: string;
  readonly summary: string;
  readonly minutes: string;
}

export const ASSESSMENT_PROTOCOLS: readonly AssessmentProtocol[] = [
  {
    definition: COGNITIVE_ASSESSMENT_QUICK,
    title: 'Quick',
    summary: 'One short pass over memory, logic, attention, speed and patterns.',
    minutes: '8–12',
  },
  {
    definition: COGNITIVE_ASSESSMENT_STANDARD,
    title: 'Standard',
    summary:
      'More challenges per area, including spatial rotation and position memory: a steadier result.',
    minutes: '20–30',
  },
  {
    definition: PROGRAMMING_ASSESSMENT,
    title: 'Programming',
    summary: 'The five areas measured with code-based tasks, for the programming route.',
    minutes: '25–40',
  },
];

export const protocolById = (id: string) =>
  ASSESSMENT_PROTOCOLS.find((p) => p.definition.id === id);
