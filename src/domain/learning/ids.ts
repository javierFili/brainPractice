import { DomainError } from '../shared/errors';

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type CourseId = Brand<string, 'CourseId'>;
export type ModuleId = Brand<string, 'ModuleId'>;
export type LessonId = Brand<string, 'LessonId'>;
export type ConceptId = Brand<string, 'ConceptId'>;
export type ExerciseId = Brand<string, 'ExerciseId'>;

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export class InvalidLearningIdError extends DomainError {
  constructor(value: string) {
    super('INVALID_LEARNING_ID', `Learning ids must be kebab-case, got "${value}"`);
  }
}

function checked(value: string): string {
  if (!KEBAB.test(value)) throw new InvalidLearningIdError(value);
  return value;
}

export const courseId = (value: string) => checked(value) as CourseId;
export const moduleId = (value: string) => checked(value) as ModuleId;
export const lessonId = (value: string) => checked(value) as LessonId;
export const conceptId = (value: string) => checked(value) as ConceptId;
export const exerciseId = (value: string) => checked(value) as ExerciseId;
