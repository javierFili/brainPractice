import { msg, type Message } from './text';

/** Programming-thinking capabilities trained by the programming specialisation. */
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

/**
 * General cognitive capabilities a challenge can declare it practises. Labels describe the task,
 * not a measured trait: a game "practises visual memory", it never "measures your visual memory".
 */
export const COGNITIVE_SKILLS = [
  'short-term-memory',
  'long-term-recall',
  'visual-memory',
  'auditory-memory',
  'selective-attention',
  'sustained-attention',
  'concentration',
  'processing-speed',
  'reaction-time',
  'problem-solving',
  'spatial-reasoning',
  'visual-orientation',
  'cognitive-flexibility',
  'sequential-thinking',
  'planning',
  'error-detection',
  'instruction-comprehension',
  'mental-agility',
] as const;

export type CognitiveSkill = (typeof COGNITIVE_SKILLS)[number];

export type Skill = ProgrammingSkill | CognitiveSkill;

export const SKILLS: readonly Skill[] = [...PROGRAMMING_SKILLS, ...COGNITIVE_SKILLS];

export const isSkill = (value: unknown): value is Skill =>
  typeof value === 'string' && (SKILLS as readonly string[]).includes(value);

/** Human label, translated by the UI (lower case, to read inside sentences). */
export const skillLabel = (skill: Skill): Message => msg(`common:skills.${skill}`);
