import type { AssessmentDefinition } from '@/domain/assessment';

/**
 * Programming Cognitive Assessment: every area sampled at a fundamentals, an intermediate and an
 * advanced level with two challenges each (30 challenges). A recreational performance profile,
 * not a psychometric instrument.
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
