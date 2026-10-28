import type { LevelTable } from '@/domain/difficulty';
import type { LogicProfile } from './types';

const seconds = (limit: number, target: number) => ({
  studyMs: null,
  limitMs: limit * 1000,
  targetMs: target * 1000,
});

/**
 * Level design for Algorithmic Logic (rationale per level in docs/game-design/algorithmic-logic.md).
 * Difficulty grows along several axes at once — graph size, program constructs, rule strength —
 * and new reasoning types appear instead of bigger numbers.
 */
export const LOGIC_LEVELS: LevelTable<LogicProfile> = {
  1: {
    level: 1,
    tier: 'fundamentals',
    objective: 'Follow simple dependencies and straight-line assignments.',
    challengeCount: 6,
    timing: seconds(90, 30),
    kinds: { 'dependency-order': 1, 'program-trace': 1 },
    graph: { nodeCount: 4, dependencyCount: 3, violation: 'obvious', weighted: false },
    program: { variableCount: 2, blockCount: 2, blocks: ['assign'], answer: 'choice' },
    constraints: { entityCount: 4, ruleTypes: ['at', 'before'], question: 'arrangement' },
  },
  2: {
    level: 2,
    tier: 'fundamentals',
    objective: 'Branching: evaluate a condition and follow only the branch it selects.',
    challengeCount: 6,
    timing: seconds(90, 35),
    kinds: { 'dependency-order': 1, 'program-trace': 1 },
    graph: { nodeCount: 5, dependencyCount: 4, violation: 'obvious', weighted: false },
    program: { variableCount: 2, blockCount: 3, blocks: ['if', 'assign'], answer: 'choice' },
    constraints: { entityCount: 4, ruleTypes: ['at', 'before'], question: 'arrangement' },
  },
  3: {
    level: 3,
    tier: 'fundamentals',
    objective: 'Near-miss orders and your first constraint puzzles: verify every rule.',
    challengeCount: 6,
    timing: seconds(120, 45),
    kinds: { 'dependency-order': 1, 'program-trace': 1, 'constraint-arrangement': 1 },
    graph: { nodeCount: 5, dependencyCount: 5, violation: 'subtle', weighted: false },
    program: {
      variableCount: 3,
      blockCount: 3,
      blocks: ['if', 'swap', 'assign'],
      answer: 'choice',
    },
    constraints: {
      entityCount: 4,
      ruleTypes: ['before', 'immediately-before', 'at', 'not-at'],
      question: 'arrangement',
    },
  },
  4: {
    level: 4,
    tier: 'intermediate',
    objective: 'Compound conditions and exact answers: no options to lean on.',
    challengeCount: 8,
    timing: seconds(120, 50),
    kinds: { 'dependency-order': 1, 'program-trace': 1.5, 'constraint-arrangement': 1 },
    graph: { nodeCount: 6, dependencyCount: 6, violation: 'subtle', weighted: false },
    program: {
      variableCount: 3,
      blockCount: 4,
      blocks: ['if-bool', 'swap', 'if', 'assign'],
      answer: 'numeric',
    },
    constraints: {
      entityCount: 4,
      ruleTypes: ['before', 'immediately-before', 'not-adjacent', 'not-at'],
      question: 'position',
    },
  },
  5: {
    level: 5,
    tier: 'intermediate',
    objective:
      'Loops and transitive dependencies: reason about what happens repeatedly and indirectly.',
    challengeCount: 8,
    timing: seconds(150, 55),
    kinds: {
      'dependency-order': 1,
      'dependency-count': 1,
      'program-trace': 1.5,
      'constraint-arrangement': 1,
    },
    graph: { nodeCount: 7, dependencyCount: 8, violation: 'subtle', weighted: false },
    program: {
      variableCount: 3,
      blockCount: 4,
      blocks: ['repeat', 'if-bool', 'swap', 'assign'],
      answer: 'numeric',
    },
    constraints: {
      entityCount: 5,
      ruleTypes: ['before', 'immediately-before', 'not-adjacent', 'at', 'not-at'],
      question: 'arrangement',
    },
  },
  6: {
    level: 6,
    tier: 'intermediate',
    objective: 'Conditions inside loops: state changes the path on every iteration.',
    challengeCount: 8,
    timing: seconds(150, 65),
    kinds: {
      'dependency-order': 1,
      'dependency-count': 1,
      'program-trace': 1.5,
      'constraint-arrangement': 1,
    },
    graph: { nodeCount: 8, dependencyCount: 10, violation: 'subtle', weighted: false },
    program: {
      variableCount: 3,
      blockCount: 5,
      blocks: ['repeat-if', 'if-bool', 'swap', 'repeat'],
      answer: 'numeric',
    },
    constraints: {
      entityCount: 5,
      ruleTypes: ['before', 'immediately-before', 'not-adjacent', 'not-at'],
      question: 'position',
    },
  },
  7: {
    level: 7,
    tier: 'advanced',
    objective: 'Open-ended loops and deduction chains across six services.',
    challengeCount: 8,
    timing: seconds(180, 75),
    kinds: {
      'dependency-order': 1,
      'dependency-count': 1,
      'program-trace': 1.5,
      'constraint-arrangement': 1.5,
    },
    graph: { nodeCount: 9, dependencyCount: 12, violation: 'subtle', weighted: false },
    program: {
      variableCount: 4,
      blockCount: 5,
      blocks: ['while', 'repeat-if', 'if-bool', 'swap'],
      answer: 'numeric',
    },
    constraints: {
      entityCount: 6,
      ruleTypes: ['before', 'immediately-before', 'not-adjacent', 'not-at'],
      question: 'position',
    },
  },
  8: {
    level: 8,
    tier: 'advanced',
    objective: 'Parallel scheduling: find the chain that bounds the whole build.',
    challengeCount: 8,
    timing: seconds(180, 85),
    kinds: {
      'critical-path': 1.5,
      'dependency-count': 1,
      'program-trace': 1.5,
      'constraint-arrangement': 1.5,
    },
    graph: { nodeCount: 9, dependencyCount: 11, violation: 'subtle', weighted: false },
    program: {
      variableCount: 4,
      blockCount: 6,
      blocks: ['while', 'repeat-if', 'if-bool', 'swap'],
      answer: 'numeric',
    },
    constraints: {
      entityCount: 6,
      ruleTypes: ['before', 'not-adjacent', 'not-at'],
      question: 'position',
    },
  },
  9: {
    level: 9,
    tier: 'expert',
    objective: 'Weighted schedules, nested loops and seven-service deductions with weak clues.',
    challengeCount: 8,
    timing: seconds(210, 95),
    kinds: {
      'critical-path': 1.5,
      'dependency-order': 1,
      'program-trace': 1.5,
      'constraint-arrangement': 1.5,
    },
    graph: { nodeCount: 10, dependencyCount: 13, violation: 'subtle', weighted: true },
    program: {
      variableCount: 4,
      blockCount: 6,
      blocks: ['nested-repeat', 'while', 'repeat-if', 'if-bool', 'swap'],
      answer: 'numeric',
    },
    constraints: {
      entityCount: 7,
      ruleTypes: ['before', 'immediately-before', 'not-adjacent', 'not-at'],
      question: 'position',
    },
  },
  10: {
    level: 10,
    tier: 'expert',
    objective: 'Everything at once: large weighted graphs, long traces and only relative clues.',
    challengeCount: 8,
    timing: seconds(240, 110),
    kinds: {
      'critical-path': 1.5,
      'dependency-count': 1,
      'program-trace': 1.5,
      'constraint-arrangement': 1.5,
    },
    graph: { nodeCount: 12, dependencyCount: 16, violation: 'subtle', weighted: true },
    program: {
      variableCount: 4,
      blockCount: 7,
      blocks: ['nested-repeat', 'while', 'repeat-if', 'if-bool', 'swap'],
      answer: 'numeric',
    },
    constraints: {
      entityCount: 7,
      ruleTypes: ['before', 'not-adjacent', 'not-at'],
      question: 'position',
    },
  },
};
