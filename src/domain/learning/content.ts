import type { CognitiveArea } from '../shared/cognitiveArea';
import type { DifficultyLevel } from '../shared/difficultyLevel';
import type { Value } from '../pseudocode/ast';
import type { Exercise } from './exercise';
import type { ConceptId, CourseId, LessonId, ModuleId } from './ids';

/**
 * Lesson text is structured data rendered as text by the UI — never raw HTML. Inline `code` in
 * paragraphs is written between backticks.
 */
export type RichBlock =
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'code'; readonly source: string; readonly caption?: string }
  | { readonly kind: 'callout'; readonly tone: 'key' | 'tip' | 'warning'; readonly text: string }
  | { readonly kind: 'list'; readonly items: readonly string[] }
  | { readonly kind: 'flow'; readonly nodes: readonly FlowNode[]; readonly caption?: string };

/** A small flowchart: nodes run top to bottom; decisions name where yes / no go. */
export type FlowNode =
  | { readonly id: string; readonly kind: 'start' | 'end'; readonly label: string }
  | { readonly id: string; readonly kind: 'action'; readonly label: string }
  | {
      readonly id: string;
      readonly kind: 'decision';
      readonly label: string;
      readonly yes: string;
      readonly no: string;
    };

/** A value the learner can change in a playground. */
export type PlaygroundInput =
  | {
      readonly name: string;
      readonly type: 'number';
      readonly initial: number;
      readonly min: number;
      readonly max: number;
      readonly step?: number;
    }
  | {
      readonly name: string;
      readonly type: 'text';
      readonly initial: string;
      readonly options?: readonly string[];
    }
  | { readonly name: string; readonly type: 'boolean'; readonly initial: boolean };

/**
 * Interactive example: a fixed program whose *inputs* the learner changes. The interpreter reruns
 * it and the UI shows the output, the variables and which lines ran. No user code is executed.
 */
export interface Playground {
  readonly inputs: readonly PlaygroundInput[];
  /** Program run after the inputs are assigned (inputs are shown as its first lines). */
  readonly source: string;
  /** Variables to display after each run; all top-level variables when omitted. */
  readonly watch?: readonly string[];
  /** What to try: "Change age to 17. Which line runs now?" */
  readonly prompts: readonly string[];
}

export const playgroundInitial = (playground: Playground): Readonly<Record<string, Value>> =>
  Object.fromEntries(playground.inputs.map((input) => [input.name, input.initial]));

/**
 * The pedagogical arc of a lesson. `guided` exercises come right after an explanation and allow
 * retries with hints; `practice` widens the idea; `checkpoint` is the mini assessment (one try,
 * no hints, counts double).
 */
export type ExercisePhase = 'guided' | 'practice' | 'checkpoint';

export type LessonStep =
  | {
      readonly kind: 'explain';
      readonly id: string;
      readonly title: string;
      readonly blocks: readonly RichBlock[];
    }
  | {
      readonly kind: 'playground';
      readonly id: string;
      readonly title: string;
      readonly intro: string;
      readonly playground: Playground;
    }
  | {
      readonly kind: 'exercise';
      readonly id: string;
      readonly phase: ExercisePhase;
      readonly exercise: Exercise;
    };

/** A link from a concept to cognitive training that supports it (TRAIN ↔ LEARN). */
export interface CognitiveLink {
  readonly area: CognitiveArea;
  readonly gameId: string;
  readonly level: DifficultyLevel;
  /** One sentence: why this training helps with this concept. */
  readonly why: string;
}

export interface Concept {
  readonly id: ConceptId;
  readonly name: string;
  readonly summary: string;
  readonly cognitiveLinks: readonly CognitiveLink[];
}

export interface Lesson {
  readonly id: LessonId;
  readonly title: string;
  /** What the learner will be able to do afterwards, as one sentence. */
  readonly objective: string;
  readonly summary: string;
  readonly minutes: number;
  readonly concepts: readonly ConceptId[];
  readonly steps: readonly LessonStep[];
  /** Short recap shown on completion (also used by reviews). */
  readonly keyPoints: readonly string[];
}

export interface Module {
  readonly id: ModuleId;
  readonly title: string;
  readonly summary: string;
  readonly lessons: readonly Lesson[];
}

export interface Course {
  readonly id: CourseId;
  readonly title: string;
  readonly summary: string;
  readonly concepts: readonly Concept[];
  readonly modules: readonly Module[];
}

export const lessonsOf = (course: Course): readonly Lesson[] =>
  course.modules.flatMap((m) => m.lessons);

export const exercisesOf = (lesson: Lesson): readonly Exercise[] =>
  lesson.steps.flatMap((step) => (step.kind === 'exercise' ? [step.exercise] : []));

export function findLesson(course: Course, id: string): Lesson | undefined {
  return lessonsOf(course).find((lesson) => lesson.id === id);
}

export function conceptOf(course: Course, id: string): Concept | undefined {
  return course.concepts.find((concept) => concept.id === id);
}
