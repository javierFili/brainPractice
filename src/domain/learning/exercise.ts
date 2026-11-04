import type { ChoiceOption } from '../challenge/responseFormats';
import type { Text } from '../shared/text';
import type { ConceptId, ExerciseId } from './ids';

/** The three things we want a learner to be able to do with a concept. */
export const MASTERY_DIMENSIONS = ['understanding', 'application', 'debugging'] as const;
export type MasteryDimension = (typeof MASTERY_DIMENSIONS)[number];

/** Code shown with an exercise. `highlight` marks 1-based lines worth looking at. */
export interface CodeSnippet {
  readonly source: string;
  readonly highlight?: readonly number[];
}

interface ExerciseBase<K extends string> {
  readonly id: ExerciseId;
  readonly kind: K;
  readonly prompt: Text;
  readonly concept: ConceptId;
  readonly dimension: MasteryDimension;
  /** Revealed one at a time after wrong attempts. */
  readonly hints: readonly Text[];
  /** Why the correct answer is correct — 1 to 3 short sentences. */
  readonly explanation: Text;
}

export interface MultipleChoiceExercise extends ExerciseBase<'multiple-choice'> {
  readonly code?: CodeSnippet;
  readonly options: readonly ChoiceOption[];
  readonly correctOptionId: string;
  /** Why each wrong option is tempting and wrong, keyed by option id. Required for every distractor. */
  readonly misconceptions: Readonly<Record<string, Text>>;
}

/** What a prediction asks about: one variable's final value, or everything printed. */
export type PredictionTarget =
  { readonly kind: 'variable'; readonly name: string } | { readonly kind: 'output' };

export interface PredictionExercise extends ExerciseBase<'prediction'> {
  readonly code: CodeSnippet;
  readonly target: PredictionTarget;
  /**
   * The answer as the learner would type it (`30`, `"adult"`, `true`, `[1, 2]`, or printed lines
   * joined with a newline). Content tests check it against the interpreter.
   */
  readonly expected: string;
  /** Specific wrong answers (normalised) and the reasoning slip that produces them. */
  readonly commonMistakes?: Readonly<Record<string, Text>>;
}

export interface CompletionBlank {
  readonly id: string;
  readonly options: readonly string[];
  readonly correct: string;
}

export interface CodeCompletionExercise extends ExerciseBase<'code-completion'> {
  /** Source with `[[blank-id]]` placeholders. */
  readonly template: string;
  readonly blanks: readonly CompletionBlank[];
  /** Optional proof that the completed code works: the variable and its expected literal. */
  readonly check?: { readonly variable: string; readonly expected: string };
  /** Why a specific wrong choice fails, keyed by `${blankId}:${option}`. */
  readonly misconceptions?: Readonly<Record<string, Text>>;
}

export interface OrderingExercise extends ExerciseBase<'ordering'> {
  /** In the correct order; the UI shows them shuffled. */
  readonly items: readonly ChoiceOption[];
}

export interface BlockBuilderExercise extends ExerciseBase<'block-builder'> {
  readonly blocks: readonly ChoiceOption[];
  /** Ordered ids of the blocks that make the algorithm; every other block is a distractor. */
  readonly solution: readonly string[];
  /** Why each distractor block does not belong, keyed by block id. */
  readonly misconceptions: Readonly<Record<string, Text>>;
}

export interface MatchingExercise extends ExerciseBase<'matching'> {
  /** Correct pairs; the UI shuffles the right-hand side. */
  readonly pairs: readonly { readonly left: ChoiceOption; readonly right: ChoiceOption }[];
}

export interface DebuggingExercise extends ExerciseBase<'debugging'> {
  readonly code: CodeSnippet;
  /** 1-based line that contains the bug. */
  readonly bugLine: number;
  /** "Why is it wrong?" — the reasoning matters more than the line. */
  readonly causes: readonly ChoiceOption[];
  readonly correctCauseId: string;
  readonly misconceptions: Readonly<Record<string, Text>>;
  /** The fixed program and what proves both versions: content tests run them. */
  readonly fix: {
    readonly source: string;
    readonly variable: string;
    readonly expected: string;
  };
}

export type Exercise =
  | MultipleChoiceExercise
  | PredictionExercise
  | CodeCompletionExercise
  | OrderingExercise
  | BlockBuilderExercise
  | MatchingExercise
  | DebuggingExercise;

export type ExerciseKind = Exercise['kind'];
export type ExerciseOf<K extends ExerciseKind> = Extract<Exercise, { kind: K }>;

export type ExerciseAnswer =
  | { readonly kind: 'multiple-choice'; readonly optionId: string }
  | { readonly kind: 'prediction'; readonly value: string }
  | { readonly kind: 'code-completion'; readonly blanks: Readonly<Record<string, string>> }
  | { readonly kind: 'ordering'; readonly order: readonly string[] }
  | { readonly kind: 'block-builder'; readonly order: readonly string[] }
  | { readonly kind: 'matching'; readonly pairs: Readonly<Record<string, string>> }
  | { readonly kind: 'debugging'; readonly line: number; readonly causeId: string };

export type AnswerOf<K extends ExerciseKind> = Extract<ExerciseAnswer, { kind: K }>;

/** Replaces `[[id]]` placeholders with the chosen values. */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\[\[([a-z0-9-]+)\]\]/g, (match, id: string) => values[id] ?? match);
}
