import {
  conceptId,
  courseId,
  exerciseId,
  lessonId,
  moduleId,
  type Course,
  type Exercise,
  type Lesson,
} from '@/domain/learning';

const variables = conceptId('fixture-variables');
const conditions = conceptId('fixture-conditions');

export const predictAge: Exercise = {
  id: exerciseId('fx-predict-age'),
  kind: 'prediction',
  prompt: 'What is the value of total?',
  concept: variables,
  dimension: 'application',
  hints: ['Replace age by its value first.'],
  explanation: 'age holds 25, so age + 5 is 25 + 5 = 30.',
  code: { source: 'age = 25\ntotal = age + 5' },
  target: { kind: 'variable', name: 'total' },
  expected: '30',
  commonMistakes: {
    '25': 'That is age itself: total is computed from it, it does not replace it.',
  },
};

export const chooseStore: Exercise = {
  id: exerciseId('fx-mc-store'),
  kind: 'multiple-choice',
  prompt: 'What does a variable do?',
  concept: variables,
  dimension: 'understanding',
  hints: ['Think of a labelled box.'],
  explanation: 'A variable is a name that refers to a stored value.',
  options: [
    { id: 'a', label: 'It stores a value under a name' },
    { id: 'b', label: 'It prints text' },
    { id: 'c', label: 'It repeats code' },
  ],
  correctOptionId: 'a',
  misconceptions: {
    b: 'Printing shows a value; it does not keep one.',
    c: 'Repeating is the job of loops.',
  },
};

const completeSum: Exercise = {
  id: exerciseId('fx-complete-sum'),
  kind: 'code-completion',
  prompt: 'Complete the code so that total is 12.',
  concept: variables,
  dimension: 'application',
  hints: ['Which operator joins two numbers into a sum?'],
  explanation: 'a + b adds the two stored values: 5 + 7 = 12.',
  template: 'a = 5\nb = 7\ntotal = a [[op]] b',
  blanks: [{ id: 'op', options: ['+', '-', '*'], correct: '+' }],
  check: { variable: 'total', expected: '12' },
  misconceptions: { 'op:-': '5 - 7 is -2.', 'op:*': '5 * 7 is 35.' },
};

const orderSwap: Exercise = {
  id: exerciseId('fx-order-steps'),
  kind: 'ordering',
  prompt: 'Order the steps to double a number and show it.',
  concept: variables,
  dimension: 'understanding',
  hints: ['A value must exist before it is used.'],
  explanation: 'Set the value, compute with it, then show the result.',
  items: [
    { id: 'set', label: 'n = 4' },
    { id: 'double', label: 'n = n * 2' },
    { id: 'show', label: 'print(n)' },
  ],
};

export const debugTotal: Exercise = {
  id: exerciseId('fx-debug-total'),
  kind: 'debugging',
  prompt: 'total should be 8. Which line is wrong, and why?',
  concept: variables,
  dimension: 'debugging',
  hints: ['Read each line and write down the value it produces.'],
  explanation: 'Line 2 overwrites total instead of adding to it.',
  code: { source: 'total = 5\ntotal = 3\nprint(total)' },
  bugLine: 2,
  causes: [
    { id: 'overwrite', label: 'It replaces the value instead of adding to it' },
    { id: 'order', label: 'The lines are in the wrong order' },
  ],
  correctCauseId: 'overwrite',
  misconceptions: { order: 'Swapping the lines would still lose one of the values.' },
  fix: { source: 'total = 5\ntotal = total + 3\nprint(total)', variable: 'total', expected: '8' },
};

const matchTypes: Exercise = {
  id: exerciseId('fx-match-types'),
  kind: 'matching',
  prompt: 'Match each value with its kind.',
  concept: variables,
  dimension: 'understanding',
  hints: [],
  explanation: 'Quotes make text; true/false are booleans; digits are numbers.',
  pairs: [
    { left: { id: 'n', label: '42' }, right: { id: 'number', label: 'number' } },
    { left: { id: 's', label: '"42"' }, right: { id: 'text', label: 'text' } },
    { left: { id: 'b', label: 'true' }, right: { id: 'bool', label: 'true/false' } },
  ],
};

export const variablesLesson: Lesson = {
  id: lessonId('fixture-variables'),
  title: 'Fixture variables',
  objective: 'Read and update stored values.',
  summary: 'A test lesson.',
  minutes: 5,
  concepts: [variables],
  keyPoints: ['A variable names a value.'],
  steps: [
    {
      kind: 'explain',
      id: 'intro',
      title: 'Values with names',
      blocks: [{ kind: 'paragraph', text: 'A variable stores a value: `age = 25`.' }],
    },
    {
      kind: 'playground',
      id: 'play',
      title: 'Try it',
      intro: 'Change age.',
      playground: {
        inputs: [{ name: 'age', type: 'number', initial: 25, min: 0, max: 99 }],
        source: 'later = age + 5\nprint(later)',
        prompts: ['Set age to 10.'],
      },
    },
    { kind: 'exercise', id: 'e1', phase: 'guided', exercise: chooseStore },
    { kind: 'exercise', id: 'e2', phase: 'guided', exercise: predictAge },
    { kind: 'exercise', id: 'e3', phase: 'practice', exercise: completeSum },
    { kind: 'exercise', id: 'e4', phase: 'practice', exercise: orderSwap },
    { kind: 'exercise', id: 'e5', phase: 'checkpoint', exercise: debugTotal },
    { kind: 'exercise', id: 'e6', phase: 'checkpoint', exercise: matchTypes },
  ],
};

const conditionExercises: Exercise[] = [
  {
    id: exerciseId('fx-cond-predict'),
    kind: 'prediction',
    prompt: 'What is result?',
    concept: conditions,
    dimension: 'application',
    hints: ['Is 10 > 5 true?'],
    explanation: 'x is 10, so x > 5 is true and the first branch runs.',
    code: { source: 'x = 10\nif x > 5:\n    result = "A"\nelse:\n    result = "B"' },
    target: { kind: 'variable', name: 'result' },
    expected: '"A"',
    commonMistakes: { '"B"': 'The else branch only runs when the condition is false.' },
  },
  {
    id: exerciseId('fx-cond-mc'),
    kind: 'multiple-choice',
    prompt: 'How many branches of an if/else run?',
    concept: conditions,
    dimension: 'understanding',
    hints: ['It is a decision.'],
    explanation: 'Exactly one branch runs.',
    options: [
      { id: 'one', label: 'Exactly one' },
      { id: 'both', label: 'Both' },
    ],
    correctOptionId: 'one',
    misconceptions: { both: 'A decision picks one path.' },
  },
  {
    id: exerciseId('fx-cond-build'),
    kind: 'block-builder',
    prompt: 'Build: say "adult" when age is at least 18.',
    concept: conditions,
    dimension: 'application',
    hints: ['Start with the question.'],
    explanation: 'Ask the question, then act in the yes branch.',
    blocks: [
      { id: 'ask', label: 'if age >= 18:' },
      { id: 'say', label: '    print("adult")' },
      { id: 'wrong', label: 'if age > 18:' },
    ],
    solution: ['ask', 'say'],
    misconceptions: { wrong: '> 18 leaves out people who are exactly 18.' },
  },
  {
    id: exerciseId('fx-cond-debug'),
    kind: 'debugging',
    prompt: 'label should be "pass" for score 50.',
    concept: conditions,
    dimension: 'debugging',
    hints: ['Check the boundary value 50.'],
    explanation: '> excludes 50 itself; >= includes it.',
    code: { source: 'score = 50\nif score > 50:\n    label = "pass"\nelse:\n    label = "fail"' },
    bugLine: 2,
    causes: [
      { id: 'boundary', label: 'The comparison excludes the boundary' },
      { id: 'else', label: 'The else branch is wrong' },
    ],
    correctCauseId: 'boundary',
    misconceptions: { else: 'else is fine: it runs whenever the condition is false.' },
    fix: {
      source: 'score = 50\nif score >= 50:\n    label = "pass"\nelse:\n    label = "fail"',
      variable: 'label',
      expected: '"pass"',
    },
  },
  {
    id: exerciseId('fx-cond-checkpoint'),
    kind: 'prediction',
    prompt: 'What does it print?',
    concept: conditions,
    dimension: 'application',
    hints: [],
    explanation: '3 is not greater than 5, so the else branch prints "small".',
    code: { source: 'n = 3\nif n > 5:\n    print("big")\nelse:\n    print("small")' },
    target: { kind: 'output' },
    expected: 'small',
  },
];

export const conditionsLesson: Lesson = {
  id: lessonId('fixture-conditions'),
  title: 'Fixture conditions',
  objective: 'Predict which branch runs.',
  summary: 'A second test lesson.',
  minutes: 5,
  concepts: [conditions],
  keyPoints: ['Exactly one branch runs.'],
  steps: [
    {
      kind: 'explain',
      id: 'intro',
      title: 'Decisions',
      blocks: [
        {
          kind: 'flow',
          nodes: [
            { id: 's', kind: 'start', label: 'Start' },
            { id: 'q', kind: 'decision', label: 'age >= 18?', yes: 'a', no: 'm' },
            { id: 'a', kind: 'action', label: 'adult' },
            { id: 'm', kind: 'action', label: 'minor' },
            { id: 'e', kind: 'end', label: 'End' },
          ],
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play',
      title: 'Try it',
      intro: 'Change x.',
      playground: {
        inputs: [{ name: 'x', type: 'number', initial: 10, min: -5, max: 20 }],
        source: 'if x > 5:\n    result = "A"\nelse:\n    result = "B"',
        prompts: ['Make result "B".'],
      },
    },
    ...conditionExercises.map((exercise, i) => ({
      kind: 'exercise' as const,
      id: `e${i + 1}`,
      phase: i === conditionExercises.length - 1 ? ('checkpoint' as const) : ('guided' as const),
      exercise,
    })),
  ],
};

export const fixtureCourse: Course = {
  id: courseId('fixture-course'),
  title: 'Fixture course',
  summary: 'Two lessons for tests.',
  concepts: [
    {
      id: variables,
      name: 'Variables',
      summary: 'Named values.',
      cognitiveLinks: [
        { area: 'memory', gameId: 'code-memory', level: 2, why: 'Holding values in mind.' },
      ],
    },
    {
      id: conditions,
      name: 'Conditions',
      summary: 'Decisions.',
      cognitiveLinks: [
        { area: 'logic', gameId: 'algorithmic-logic', level: 2, why: 'Following branches.' },
      ],
    },
  ],
  modules: [
    {
      id: moduleId('fixture-module'),
      title: 'Fixture module',
      summary: 'Test module.',
      lessons: [variablesLesson, conditionsLesson],
    },
  ],
};
