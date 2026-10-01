import { execute } from '../pseudocode/source';
import { literal } from '../pseudocode/run';
import type { Variables } from '../pseudocode/run';
import {
  exercisesOf,
  lessonsOf,
  playgroundInitial,
  type Course,
  type Lesson,
  type Playground,
} from './content';
import { canonicalValue, predictionMatches } from './evaluate';
import { fillTemplate, MASTERY_DIMENSIONS, type Exercise } from './exercise';

/**
 * Content invariants, checked by tests over the whole curriculum. Answers are not trusted: every
 * prediction and every bug fix is executed by the interpreter.
 */
export function validateCourse(course: Course): string[] {
  const issues: string[] = [];
  const conceptIds = new Set(course.concepts.map((c) => c.id));
  const seen = new Set<string>();
  const unique = (kind: string, id: string) => {
    if (seen.has(`${kind}:${id}`)) issues.push(`duplicate ${kind} id "${id}"`);
    seen.add(`${kind}:${id}`);
  };

  for (const concept of course.concepts) {
    unique('concept', concept.id);
    if (concept.cognitiveLinks.length === 0)
      issues.push(`concept ${concept.id}: no cognitive link`);
  }
  for (const lesson of lessonsOf(course)) {
    unique('lesson', lesson.id);
    issues.push(...validateLesson(lesson, conceptIds).map((issue) => `${lesson.id}: ${issue}`));
    for (const exercise of exercisesOf(lesson)) unique('exercise', exercise.id);
  }
  const taught = new Set(lessonsOf(course).flatMap((l) => l.concepts));
  for (const concept of course.concepts)
    if (!taught.has(concept.id)) issues.push(`concept ${concept.id} is never taught`);
  return issues;
}

export function validateLesson(lesson: Lesson, conceptIds: ReadonlySet<string>): string[] {
  const issues: string[] = [];
  if (lesson.objective.trim() === '') issues.push('objective is empty');
  if (lesson.keyPoints.length === 0) issues.push('no key points');
  if (lesson.concepts.length === 0) issues.push('teaches no concept');
  for (const concept of lesson.concepts)
    if (!conceptIds.has(concept)) issues.push(`unknown concept ${concept}`);

  const stepIds = new Set<string>();
  for (const step of lesson.steps) {
    if (stepIds.has(step.id)) issues.push(`duplicate step id ${step.id}`);
    stepIds.add(step.id);
  }
  const kinds = lesson.steps.map((s) => s.kind);
  if (kinds[0] !== 'explain') issues.push('must open with an explanation');
  if (!kinds.includes('playground')) issues.push('needs an interactive playground');

  const exerciseSteps = lesson.steps.flatMap((s) => (s.kind === 'exercise' ? [s] : []));
  if (exerciseSteps.length < 5)
    issues.push(`needs at least 5 exercises, has ${exerciseSteps.length}`);
  if (!exerciseSteps.some((s) => s.phase === 'checkpoint')) issues.push('needs a checkpoint');
  const lastExercise = lesson.steps.findLastIndex((s) => s.kind === 'exercise');
  const firstCheckpoint = lesson.steps.findIndex(
    (s) => s.kind === 'exercise' && s.phase === 'checkpoint',
  );
  if (
    firstCheckpoint !== -1 &&
    lesson.steps
      .slice(firstCheckpoint, lastExercise + 1)
      .some((s) => s.kind === 'exercise' && s.phase !== 'checkpoint')
  )
    issues.push('checkpoint exercises must come last');
  for (const dimension of MASTERY_DIMENSIONS)
    if (!exerciseSteps.some((s) => s.exercise.dimension === dimension))
      issues.push(`no exercise trains ${dimension}`);
  if (new Set(exerciseSteps.map((s) => s.exercise.kind)).size < 3)
    issues.push('use at least 3 kinds of exercise');

  for (const step of lesson.steps) {
    if (step.kind === 'playground')
      issues.push(...validatePlayground(step.playground).map((i) => `${step.id}: ${i}`));
    if (step.kind !== 'exercise') continue;
    const { exercise } = step;
    if (!lesson.concepts.includes(exercise.concept))
      issues.push(`${exercise.id}: concept ${exercise.concept} is not one of the lesson's`);
    if (step.phase === 'guided' && exercise.hints.length === 0)
      issues.push(`${exercise.id}: guided exercises need a hint`);
    if (exercise.explanation.trim() === '') issues.push(`${exercise.id}: no explanation`);
    issues.push(...validateExercise(exercise).map((i) => `${exercise.id}: ${i}`));
  }
  return issues;
}

function validatePlayground(playground: Playground): string[] {
  const issues: string[] = [];
  for (const input of playground.inputs)
    if (input.type === 'number' && (input.initial < input.min || input.initial > input.max))
      issues.push(`input ${input.name} starts outside its range`);
  if (playground.prompts.length === 0) issues.push('needs at least one thing to try');
  const run = execute(playground.source, playgroundInitial(playground));
  if (!run.ok) return [...issues, `syntax error line ${run.error.line}: ${run.error.message}`];
  if (run.value.error) issues.push(`fails with the initial inputs: ${run.value.error.message}`);
  return issues;
}

const distinct = (values: readonly string[]) => new Set(values).size === values.length;

/** Literal value of `variable` after running `source`, or the error. */
function valueAfter(
  source: string,
  variable: string,
  inputs: Variables = {},
): { value?: string; error?: string } {
  const run = execute(source, inputs);
  if (!run.ok) return { error: `syntax error line ${run.error.line}: ${run.error.message}` };
  if (run.value.error) return { error: run.value.error.message };
  const value = run.value.variables[variable];
  return value === undefined ? { error: `${variable} is never set` } : { value: literal(value) };
}

export function validateExercise(exercise: Exercise): string[] {
  const issues: string[] = [];
  switch (exercise.kind) {
    case 'multiple-choice': {
      const ids = exercise.options.map((o) => o.id);
      if (exercise.options.length < 2) issues.push('needs at least 2 options');
      if (!distinct(ids) || !distinct(exercise.options.map((o) => o.label)))
        issues.push('duplicate options');
      if (!ids.includes(exercise.correctOptionId)) issues.push('correct option is missing');
      for (const id of ids)
        if (id !== exercise.correctOptionId && !exercise.misconceptions[id])
          issues.push(`option ${id} has no misconception`);
      if (exercise.code) issues.push(...parses(exercise.code.source));
      break;
    }
    case 'prediction': {
      const run = execute(exercise.code.source);
      if (!run.ok) {
        issues.push(`syntax error line ${run.error.line}: ${run.error.message}`);
        break;
      }
      if (run.value.error) {
        issues.push(`program fails: ${run.value.error.message}`);
        break;
      }
      const actual =
        exercise.target.kind === 'output'
          ? run.value.output.join('\n')
          : (() => {
              const value = run.value.variables[(exercise.target as { name: string }).name];
              return value === undefined ? undefined : literal(value);
            })();
      if (actual === undefined) issues.push('the asked variable is never set');
      else if (!predictionMatches(actual, exercise.expected, exercise.target.kind))
        issues.push(`expected ${exercise.expected} but the program gives ${actual}`);
      for (const wrong of Object.keys(exercise.commonMistakes ?? {}))
        if (predictionMatches(wrong, exercise.expected, exercise.target.kind))
          issues.push(`common mistake ${wrong} is actually the right answer`);
      break;
    }
    case 'code-completion': {
      const placeholders = [...exercise.template.matchAll(/\[\[([a-z0-9-]+)\]\]/g)].map(
        (m) => m[1],
      );
      const blankIds = exercise.blanks.map((b) => b.id);
      if (
        !distinct(blankIds) ||
        placeholders.length !== blankIds.length ||
        blankIds.some((id) => !placeholders.includes(id))
      )
        issues.push('blanks and [[placeholders]] do not match');
      for (const blank of exercise.blanks) {
        if (!blank.options.includes(blank.correct))
          issues.push(`blank ${blank.id}: correct option missing`);
        if (!distinct(blank.options)) issues.push(`blank ${blank.id}: duplicate options`);
      }
      const correct = Object.fromEntries(exercise.blanks.map((b) => [b.id, b.correct]));
      const filled = fillTemplate(exercise.template, correct);
      if (!exercise.check) {
        issues.push(...parses(filled));
        break;
      }
      const result = valueAfter(filled, exercise.check.variable);
      if (result.error) issues.push(`completed code fails: ${result.error}`);
      else if (canonicalValue(result.value ?? '') !== canonicalValue(exercise.check.expected))
        issues.push(`completed code gives ${result.value}, not ${exercise.check.expected}`);
      // Every single wrong choice must actually break the check, or the answer is ambiguous.
      for (const blank of exercise.blanks)
        for (const option of blank.options.filter((o) => o !== blank.correct)) {
          const variant = valueAfter(
            fillTemplate(exercise.template, { ...correct, [blank.id]: option }),
            exercise.check.variable,
          );
          if (
            variant.value !== undefined &&
            canonicalValue(variant.value) === canonicalValue(exercise.check.expected)
          )
            issues.push(`blank ${blank.id}: "${option}" also works, so the answer is ambiguous`);
        }
      break;
    }
    case 'ordering':
      if (exercise.items.length < 3) issues.push('needs at least 3 items');
      if (
        !distinct(exercise.items.map((i) => i.id)) ||
        !distinct(exercise.items.map((i) => i.label))
      )
        issues.push('duplicate items');
      break;
    case 'block-builder': {
      const ids = exercise.blocks.map((b) => b.id);
      if (!distinct(ids) || !distinct(exercise.blocks.map((b) => b.label)))
        issues.push('duplicate blocks');
      if (exercise.solution.some((id) => !ids.includes(id)))
        issues.push('solution uses unknown blocks');
      if (!distinct([...exercise.solution])) issues.push('solution repeats a block');
      const distractors = ids.filter((id) => !exercise.solution.includes(id));
      if (distractors.length === 0) issues.push('needs at least one distractor block');
      for (const id of distractors)
        if (!exercise.misconceptions[id]) issues.push(`distractor ${id} has no misconception`);
      break;
    }
    case 'matching':
      if (exercise.pairs.length < 3) issues.push('needs at least 3 pairs');
      if (
        !distinct(exercise.pairs.map((p) => p.left.id)) ||
        !distinct(exercise.pairs.map((p) => p.right.id))
      )
        issues.push('duplicate pair ids');
      if (!distinct(exercise.pairs.map((p) => p.right.label)))
        issues.push('two answers read the same');
      break;
    case 'debugging': {
      const lines = exercise.code.source.split('\n');
      const fixed = exercise.fix.source.split('\n');
      if (exercise.bugLine < 1 || exercise.bugLine > lines.length)
        issues.push('bug line out of range');
      if (
        lines.length !== fixed.length ||
        lines.some((line, i) => i + 1 !== exercise.bugLine && line !== fixed[i])
      )
        issues.push('the fix must change only the bug line');
      if (lines[exercise.bugLine - 1] === fixed[exercise.bugLine - 1])
        issues.push('the fix changes nothing');
      const ids = exercise.causes.map((c) => c.id);
      if (!ids.includes(exercise.correctCauseId)) issues.push('correct cause missing');
      for (const id of ids)
        if (id !== exercise.correctCauseId && !exercise.misconceptions[id])
          issues.push(`cause ${id} has no misconception`);
      const good = valueAfter(exercise.fix.source, exercise.fix.variable);
      if (good.error) issues.push(`fixed code fails: ${good.error}`);
      else if (canonicalValue(good.value ?? '') !== canonicalValue(exercise.fix.expected))
        issues.push(`fixed code gives ${good.value}, not ${exercise.fix.expected}`);
      const bad = valueAfter(exercise.code.source, exercise.fix.variable);
      if (
        bad.value !== undefined &&
        canonicalValue(bad.value) === canonicalValue(exercise.fix.expected)
      )
        issues.push('the buggy code already gives the right result');
      break;
    }
  }
  return issues;
}

function parses(source: string): string[] {
  const run = execute(source);
  return run.ok ? [] : [`syntax error line ${run.error.line}: ${run.error.message}`];
}
