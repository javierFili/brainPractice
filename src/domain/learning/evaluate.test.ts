import { chooseStore, debugTotal, fixtureCourse, predictAge } from '@/test/fixtures/learningCourse';
import { en } from '@/test/i18n';
import { canonicalValue, evaluateExercise, predictionMatches } from './evaluate';
import { exercisesOf, findLesson } from './content';
import type { Exercise, ExerciseOf } from './exercise';

const all = fixtureCourse.modules.flatMap((m) => m.lessons).flatMap((l) => exercisesOf(l));
const ofKind = <K extends Exercise['kind']>(kind: K) =>
  all.find((e): e is ExerciseOf<K> => e.kind === kind) as ExerciseOf<K>;

const evaluate = (exercise: Exercise, answer: Parameters<typeof evaluateExercise>[1]) => {
  const result = evaluateExercise(exercise, answer);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
};

describe('Feedback Engine — multiple choice', () => {
  it('explains the distractor the learner chose, not just "incorrect"', () => {
    const { verdict, credit, feedback } = evaluate(chooseStore, {
      kind: 'multiple-choice',
      optionId: 'b',
    });
    expect({ verdict, credit }).toEqual({ verdict: 'incorrect', credit: 0 });
    expect(en(feedback.yourAnswer)).toBe('You chose “It prints text”.');
    expect(feedback.diagnosis.map(en)).toEqual(['Printing shows a value; it does not keep one.']);
    expect(en(feedback.correctAnswer)).toBe('It stores a value under a name');
    expect(en(feedback.explanation)).toMatch(/name that refers/);
  });

  it('confirms a correct answer without a diagnosis', () => {
    const { verdict, feedback } = evaluate(chooseStore, { kind: 'multiple-choice', optionId: 'a' });
    expect(verdict).toBe('correct');
    expect(en(feedback.headline)).toBe('Correct.');
    expect(feedback.diagnosis.map(en)).toEqual([]);
  });

  it('rejects unknown options and mismatched answer kinds', () => {
    expect(evaluateExercise(chooseStore, { kind: 'multiple-choice', optionId: 'z' })).toMatchObject(
      {
        ok: false,
        error: { code: 'UNKNOWN_CHOICE' },
      },
    );
    expect(evaluateExercise(chooseStore, { kind: 'prediction', value: '1' })).toMatchObject({
      ok: false,
      error: { code: 'KIND_MISMATCH', expected: 'multiple-choice' },
    });
  });
});

describe('Feedback Engine — prediction', () => {
  it('accepts the right value however it is spelled', () => {
    for (const value of ['30', ' 30 ', '30.0'])
      expect(evaluate(predictAge, { kind: 'prediction', value }).verdict).toBe('correct');
  });

  it('names the reasoning slip behind a known wrong answer', () => {
    const { feedback } = evaluate(predictAge, { kind: 'prediction', value: '25' });
    expect(en(feedback.diagnosis[0] ?? '')).toMatch(/That is age itself/);
    expect(evaluate(predictAge, { kind: 'prediction', value: '31' }).feedback.diagnosis).toEqual(
      [],
    );
  });

  it('rejects an empty answer instead of marking it wrong', () => {
    expect(evaluateExercise(predictAge, { kind: 'prediction', value: '  ' })).toMatchObject({
      ok: false,
      error: { code: 'EMPTY' },
    });
  });

  it.each([
    ['"adult"', 'adult', true],
    ['"adult"', "'adult'", true],
    ['"adult"', '"Adult"', false],
    ['true', 'True', true],
    ['[1, 2]', '[1,2]', true],
    ['["a", "b"]', "['a','b']", true],
    ['3', '"3"', false],
  ])('expected %s vs typed %s → %s', (expected, typed, matches) => {
    expect(predictionMatches(typed, expected, 'variable')).toBe(matches);
  });

  it('compares printed output line by line, ignoring spacing', () => {
    expect(predictionMatches('small\n', 'small', 'output')).toBe(true);
    expect(predictionMatches('a  b\nc', 'a b\nc', 'output')).toBe(true);
    expect(predictionMatches('c\na', 'a\nc', 'output')).toBe(false);
    expect(canonicalValue(' [ 1 , 2.50 ] ')).toBe('[1,2.5]');
  });
});

describe('Feedback Engine — structured answers', () => {
  it('gives partial credit per blank and explains the wrong choice', () => {
    const exercise = ofKind('code-completion');
    expect(evaluate(exercise, { kind: 'code-completion', blanks: { op: '+' } }).credit).toBe(1);
    const wrong = evaluate(exercise, { kind: 'code-completion', blanks: { op: '*' } });
    expect(wrong.verdict).toBe('incorrect');
    expect(wrong.feedback.diagnosis.map(en)).toEqual(['5 * 7 is 35.']);
    expect(evaluateExercise(exercise, { kind: 'code-completion', blanks: {} }).ok).toBe(false);
  });

  it('scores orderings: exact, mostly right, or wrong', () => {
    const exercise = ofKind('ordering');
    expect(evaluate(exercise, { kind: 'ordering', order: ['set', 'double', 'show'] }).credit).toBe(
      1,
    );
    const swapped = evaluate(exercise, { kind: 'ordering', order: ['double', 'set', 'show'] });
    expect(swapped.credit).toBe(0);
    expect(en(swapped.feedback.diagnosis[0] ?? '')).toBe('Step 1 should be “n = 4”.');
    expect(evaluateExercise(exercise, { kind: 'ordering', order: ['set', 'set', 'show'] }).ok).toBe(
      false,
    );
  });

  it('builds algorithms from blocks and explains distractor blocks', () => {
    const exercise = ofKind('block-builder');
    expect(evaluate(exercise, { kind: 'block-builder', order: ['ask', 'say'] }).verdict).toBe(
      'correct',
    );
    const distractor = evaluate(exercise, { kind: 'block-builder', order: ['wrong', 'say'] });
    expect(distractor.verdict).toBe('incorrect');
    expect(en(distractor.feedback.diagnosis[0] ?? '')).toMatch(/exactly 18/);
    expect(evaluate(exercise, { kind: 'block-builder', order: ['say', 'ask'] })).toMatchObject({
      verdict: 'partial',
      credit: 0.5,
    });
  });

  it('matches pairs with partial credit', () => {
    const exercise = ofKind('matching');
    const all = { n: 'number', s: 'text', b: 'bool' };
    expect(evaluate(exercise, { kind: 'matching', pairs: all }).credit).toBe(1);
    expect(
      evaluate(exercise, { kind: 'matching', pairs: { n: 'text', s: 'number', b: 'bool' } }).credit,
    ).toBe(0);
    expect(evaluateExercise(exercise, { kind: 'matching', pairs: { n: 'number' } }).ok).toBe(false);
  });

  it('debugging rewards the reasoning, not only the line', () => {
    const both = evaluate(debugTotal, { kind: 'debugging', line: 2, causeId: 'overwrite' });
    expect(both.verdict).toBe('correct');
    const lineOnly = evaluate(debugTotal, { kind: 'debugging', line: 2, causeId: 'order' });
    expect(lineOnly).toMatchObject({ verdict: 'partial', credit: 0.5 });
    expect(lineOnly.feedback.diagnosis.map(en)).toEqual([
      'Swapping the lines would still lose one of the values.',
    ]);
    const reasonOnly = evaluate(debugTotal, { kind: 'debugging', line: 1, causeId: 'overwrite' });
    expect(reasonOnly.feedback.diagnosis.map(en)).toEqual([
      'The problem is not on line 1.',
      'Your reason is right, though.',
    ]);
    expect(evaluateExercise(debugTotal, { kind: 'debugging', line: 9, causeId: 'order' }).ok).toBe(
      false,
    );
  });

  it('finds lessons by id', () => {
    expect(findLesson(fixtureCourse, 'fixture-conditions')?.title).toBe('Fixture conditions');
  });
});
