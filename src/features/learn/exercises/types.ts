import type { AnswerOf, ExerciseKind, ExerciseOf } from '@/domain/learning';

export interface ExerciseViewProps<K extends ExerciseKind> {
  readonly exercise: ExerciseOf<K>;
  /** False while answering; true while feedback is shown. */
  readonly locked: boolean;
  /** Show the correct answer in place (after the last attempt or on reveal). */
  readonly showSolution: boolean;
  readonly onSubmit: (answer: AnswerOf<K>) => void;
}
