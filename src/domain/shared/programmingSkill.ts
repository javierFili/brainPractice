/** Programming-thinking capabilities that every challenge declares it trains. */
export const PROGRAMMING_SKILLS = [
  'decomposition',
  'abstraction',
  'pattern-recognition',
  'logical-reasoning',
  'working-memory',
  'attention',
  'debugging',
  'algorithmic-thinking',
] as const;

export type ProgrammingSkill = (typeof PROGRAMMING_SKILLS)[number];
