import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { msg, type Message } from '@/domain/shared';
import { C } from '../concepts';

/** Every prose text of this lesson lives in the `lessons` namespace; code stays literal. */
const t = (key: string): Message => msg(`lessons:valuesAndVariables.${key}`);

export const lesson: Lesson = {
  id: lessonId('values-and-variables'),
  title: t('title'),
  objective: t('objective'),
  summary: t('summary'),
  minutes: 12,
  concepts: [C.variables],
  keyPoints: [t('keyPoints.1'), t('keyPoints.2'), t('keyPoints.3'), t('keyPoints.4')],
  steps: [
    {
      kind: 'explain',
      id: 'names-and-values',
      title: t('steps.namesAndValues.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.namesAndValues.blocks.b1'),
        },
        {
          kind: 'code',
          source: 'score = 10\nscore = 25\nscore = score + 5',
          caption: t('steps.namesAndValues.blocks.b2'),
        },
        {
          kind: 'list',
          items: [
            t('steps.namesAndValues.blocks.b3.1'),
            t('steps.namesAndValues.blocks.b3.2'),
            t('steps.namesAndValues.blocks.b3.3'),
          ],
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-update',
      title: t('steps.playUpdate.title'),
      intro: t('steps.playUpdate.intro'),
      playground: {
        inputs: [{ name: 'score', type: 'number', initial: 10, min: 0, max: 50 }],
        source: 'score = score + 5\nbonus = score * 2\nscore = 0\nprint(score, bonus)',
        watch: ['score', 'bonus'],
        prompts: [t('steps.playUpdate.prompts.1'), t('steps.playUpdate.prompts.2')],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-replace',
      phase: 'guided',
      exercise: {
        id: exerciseId('l03-mc-assignment-replaces'),
        kind: 'multiple-choice',
        prompt: t('exercises.mcAssignmentReplaces.prompt'),
        concept: C.variables,
        dimension: 'understanding',
        code: { source: 'x = 5\nx = 8' },
        hints: [t('exercises.mcAssignmentReplaces.hints.1')],
        explanation: t('exercises.mcAssignmentReplaces.explanation'),
        options: [
          { id: 'thirteen', label: '13' },
          { id: 'both', label: t('exercises.mcAssignmentReplaces.options.both') },
          { id: 'eight', label: '8' },
          { id: 'five', label: '5' },
        ],
        correctOptionId: 'eight',
        misconceptions: {
          thirteen: t('exercises.mcAssignmentReplaces.misconceptions.thirteen'),
          both: t('exercises.mcAssignmentReplaces.misconceptions.both'),
          five: t('exercises.mcAssignmentReplaces.misconceptions.five'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-read-then-write',
      phase: 'guided',
      exercise: {
        id: exerciseId('l03-predict-read-then-write'),
        kind: 'prediction',
        prompt: t('exercises.predictReadThenWrite.prompt'),
        concept: C.variables,
        dimension: 'application',
        hints: [t('exercises.predictReadThenWrite.hints.1')],
        explanation: t('exercises.predictReadThenWrite.explanation'),
        code: { source: 'points = 10\npoints = points + 5' },
        target: { kind: 'variable', name: 'points' },
        expected: '15',
        commonMistakes: {
          '10': t('exercises.predictReadThenWrite.mistakes.m1'),
          '5': t('exercises.predictReadThenWrite.mistakes.m2'),
        },
      },
    },
    {
      kind: 'explain',
      id: 'kinds-of-values',
      title: t('steps.kindsOfValues.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.kindsOfValues.blocks.b1'),
        },
        {
          kind: 'code',
          source:
            'a = 5 + 5        # 10\nb = "5" + "5"    # "55": text is joined\nc = "Age: " + str(30)   # "Age: 30"',
          caption: t('steps.kindsOfValues.blocks.b2'),
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: t('steps.kindsOfValues.blocks.b3'),
        },
        {
          kind: 'callout',
          tone: 'tip',
          text: t('steps.kindsOfValues.blocks.b4'),
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-kinds',
      title: t('steps.playKinds.title'),
      intro: t('steps.playKinds.intro'),
      playground: {
        inputs: [
          { name: 'name', type: 'text', initial: 'Ana', options: ['Ana', 'Sam', 'Lee'] },
          { name: 'age', type: 'number', initial: 30, min: 0, max: 99 },
        ],
        source:
          'next_year = age + 1\nmessage = name + " will be " + str(next_year)\nprint(message)',
        watch: ['name', 'age', 'next_year', 'message'],
        prompts: [t('steps.playKinds.prompts.1'), t('steps.playKinds.prompts.2')],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-match-kinds',
      phase: 'guided',
      exercise: {
        id: exerciseId('l03-match-value-kinds'),
        kind: 'matching',
        prompt: t('exercises.matchValueKinds.prompt'),
        concept: C.variables,
        dimension: 'understanding',
        hints: [t('exercises.matchValueKinds.hints.1')],
        explanation: t('exercises.matchValueKinds.explanation'),
        pairs: [
          {
            left: { id: 'num', label: '7' },
            right: { id: 'number', label: t('exercises.matchValueKinds.pairs.number') },
          },
          {
            left: { id: 'txt', label: '"7"' },
            right: { id: 'text', label: t('exercises.matchValueKinds.pairs.text') },
          },
          {
            left: { id: 'bool', label: 'true' },
            right: { id: 'boolean', label: t('exercises.matchValueKinds.pairs.boolean') },
          },
          {
            left: { id: 'name', label: 'total' },
            right: { id: 'variable', label: t('exercises.matchValueKinds.pairs.variable') },
          },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'ex-complete-lives',
      phase: 'practice',
      exercise: {
        id: exerciseId('l03-complete-lose-a-life'),
        kind: 'code-completion',
        prompt: t('exercises.completeLoseALife.prompt'),
        concept: C.variables,
        dimension: 'application',
        hints: [t('exercises.completeLoseALife.hints.1')],
        explanation: t('exercises.completeLoseALife.explanation'),
        template: 'lives = 3\nlives = [[read]] [[op]] 1',
        blanks: [
          { id: 'read', options: ['lives', '"lives"', 'life'], correct: 'lives' },
          { id: 'op', options: ['+', '-', '*'], correct: '-' },
        ],
        check: { variable: 'lives', expected: '2' },
        misconceptions: {
          'read:"lives"': t('exercises.completeLoseALife.misconceptions.m1'),
          'read:life': t('exercises.completeLoseALife.misconceptions.m2'),
          'op:+': t('exercises.completeLoseALife.misconceptions.m3'),
          'op:*': t('exercises.completeLoseALife.misconceptions.m4'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-text-plus',
      phase: 'practice',
      exercise: {
        id: exerciseId('l03-predict-text-plus-text'),
        kind: 'prediction',
        prompt: t('exercises.predictTextPlusText.prompt'),
        concept: C.variables,
        dimension: 'application',
        hints: [t('exercises.predictTextPlusText.hints.1')],
        explanation: t('exercises.predictTextPlusText.explanation'),
        code: { source: 'a = 5 + 5\nb = "5" + "5"' },
        target: { kind: 'variable', name: 'b' },
        expected: '"55"',
        commonMistakes: {
          '10': t('exercises.predictTextPlusText.mistakes.m1'),
          '"10"': t('exercises.predictTextPlusText.mistakes.m2'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'ex-str-rule',
      phase: 'practice',
      exercise: {
        id: exerciseId('l03-mc-text-plus-number'),
        kind: 'multiple-choice',
        prompt: t('exercises.mcTextPlusNumber.prompt'),
        concept: C.variables,
        dimension: 'debugging',
        code: { source: 'name = "Ana"\nage = 30\nline = name + " is " + age' },
        hints: [t('exercises.mcTextPlusNumber.hints.1')],
        explanation: t('exercises.mcTextPlusNumber.explanation'),
        options: [
          { id: 'works', label: t('exercises.mcTextPlusNumber.options.works') },
          { id: 'name', label: t('exercises.mcTextPlusNumber.options.name') },
          { id: 'error', label: t('exercises.mcTextPlusNumber.options.error') },
          { id: 'quotes', label: t('exercises.mcTextPlusNumber.options.quotes') },
        ],
        correctOptionId: 'error',
        misconceptions: {
          works: t('exercises.mcTextPlusNumber.misconceptions.works'),
          name: t('exercises.mcTextPlusNumber.misconceptions.name'),
          quotes: t('exercises.mcTextPlusNumber.misconceptions.quotes'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-debug-swap',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l03-debug-swap-without-temp'),
        kind: 'debugging',
        prompt: t('exercises.debugSwapWithoutTemp.prompt'),
        concept: C.variables,
        dimension: 'debugging',
        code: { source: 'a = 1\nb = 2\ntemp = a\na = b\nb = a' },
        bugLine: 5,
        hints: [],
        explanation: t('exercises.debugSwapWithoutTemp.explanation'),
        causes: [
          { id: 'temp-unused', label: t('exercises.debugSwapWithoutTemp.causes.tempUnused') },
          { id: 'no-temp', label: t('exercises.debugSwapWithoutTemp.causes.noTemp') },
          { id: 'order', label: t('exercises.debugSwapWithoutTemp.causes.order') },
        ],
        correctCauseId: 'temp-unused',
        misconceptions: {
          'no-temp': t('exercises.debugSwapWithoutTemp.misconceptions.noTemp'),
          order: t('exercises.debugSwapWithoutTemp.misconceptions.order'),
        },
        fix: {
          source: 'a = 1\nb = 2\ntemp = a\na = b\nb = temp',
          variable: 'b',
          expected: '1',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-trace-memory',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l03-predict-trace-two-variables'),
        kind: 'prediction',
        prompt: t('exercises.predictTraceTwoVariables.prompt'),
        concept: C.variables,
        dimension: 'application',
        hints: [],
        explanation: t('exercises.predictTraceTwoVariables.explanation'),
        code: { source: 'x = 3\ny = x + 2\nx = y * 2\ny = x - 1\nx = x + y' },
        target: { kind: 'variable', name: 'x' },
        expected: '19',
        commonMistakes: {
          '10': t('exercises.predictTraceTwoVariables.mistakes.m1'),
          '8': t('exercises.predictTraceTwoVariables.mistakes.m2'),
          '15': t('exercises.predictTraceTwoVariables.mistakes.m3'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'cp-x-plus-one',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l03-mc-count-plus-one'),
        kind: 'multiple-choice',
        prompt: t('exercises.mcCountPlusOne.prompt'),
        concept: C.variables,
        dimension: 'understanding',
        hints: [],
        explanation: t('exercises.mcCountPlusOne.explanation'),
        options: [
          { id: 'check', label: t('exercises.mcCountPlusOne.options.check') },
          { id: 'second', label: t('exercises.mcCountPlusOne.options.second') },
          { id: 'never', label: t('exercises.mcCountPlusOne.options.never') },
          { id: 'update', label: t('exercises.mcCountPlusOne.options.update') },
        ],
        correctOptionId: 'update',
        misconceptions: {
          check: t('exercises.mcCountPlusOne.misconceptions.check'),
          second: t('exercises.mcCountPlusOne.misconceptions.second'),
          never: t('exercises.mcCountPlusOne.misconceptions.never'),
        },
      },
    },
  ],
};
