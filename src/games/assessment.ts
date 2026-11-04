import type { AssessmentDefinition } from '@/domain/assessment';
import { msg, type Text } from '@/domain/shared';

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
  /** Full protocol name shown in history (`definition.name` is a stable English label). */
  readonly name: Text;
  readonly title: Text;
  readonly summary: Text;
  /** The start button ("Start quick assessment"). */
  readonly start: Text;
  /** Literal range in minutes, e.g. "8–12". */
  readonly minutes: string;
}

export const ASSESSMENT_PROTOCOLS: readonly AssessmentProtocol[] = [
  {
    definition: COGNITIVE_ASSESSMENT_QUICK,
    name: msg('assessment:protocols.quick.name'),
    title: msg('assessment:protocols.quick.title'),
    summary: msg('assessment:protocols.quick.summary'),
    start: msg('assessment:protocols.quick.start'),
    minutes: '8–12',
  },
  {
    definition: COGNITIVE_ASSESSMENT_STANDARD,
    name: msg('assessment:protocols.standard.name'),
    title: msg('assessment:protocols.standard.title'),
    summary: msg('assessment:protocols.standard.summary'),
    start: msg('assessment:protocols.standard.start'),
    minutes: '20–30',
  },
  {
    definition: PROGRAMMING_ASSESSMENT,
    name: msg('assessment:protocols.programming.name'),
    title: msg('assessment:protocols.programming.title'),
    summary: msg('assessment:protocols.programming.summary'),
    start: msg('assessment:protocols.programming.start'),
    minutes: '25–40',
  },
];

export const protocolById = (id: string) =>
  ASSESSMENT_PROTOCOLS.find((p) => p.definition.id === id);
