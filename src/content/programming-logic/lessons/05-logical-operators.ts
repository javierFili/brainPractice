import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { msg, type Message } from '@/domain/shared';
import { C } from '../concepts';

const code = (...lines: string[]) => lines.join('\n');

/** Every prose text of this lesson lives in the `lessons` namespace; code stays literal. */
const t = (key: string): Message => msg(`lessons:logicalOperators.${key}`);

export const lesson: Lesson = {
  id: lessonId('logical-operators'),
  title: t('title'),
  objective: t('objective'),
  summary: t('summary'),
  minutes: 11,
  concepts: [C.booleanLogic],
  keyPoints: [t('keyPoints.1'), t('keyPoints.2'), t('keyPoints.3'), t('keyPoints.4')],
  steps: [
    {
      kind: 'explain',
      id: 'intro',
      title: t('steps.intro.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.intro.blocks.b1'),
        },
        {
          kind: 'list',
          items: [
            t('steps.intro.blocks.b2.1'),
            t('steps.intro.blocks.b2.2'),
            t('steps.intro.blocks.b2.3'),
          ],
        },
        {
          kind: 'code',
          caption: t('steps.intro.blocks.b3'),
          source: code('age = 15', 'teen = age >= 13 and age <= 19'),
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: t('steps.intro.blocks.b4'),
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-ages',
      title: t('steps.playAges.title'),
      intro: t('steps.playAges.intro'),
      playground: {
        inputs: [
          { name: 'age', type: 'number', initial: 15, min: 0, max: 99 },
          { name: 'has_ticket', type: 'boolean', initial: true },
        ],
        source: code(
          'teen = age >= 13 and age <= 19',
          'free = age < 5 or age > 65',
          'can_enter = has_ticket or free',
          'print("teen:", teen)',
          'print("free:", free)',
          'print("can enter:", can_enter)',
        ),
        watch: ['age', 'has_ticket', 'teen', 'free', 'can_enter'],
        prompts: [
          t('steps.playAges.prompts.1'),
          t('steps.playAges.prompts.2'),
          t('steps.playAges.prompts.3'),
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'when-and',
      phase: 'guided',
      exercise: {
        id: exerciseId('l05-when-is-and-true'),
        kind: 'multiple-choice',
        prompt: t('exercises.whenIsAndTrue.prompt'),
        concept: C.booleanLogic,
        dimension: 'understanding',
        hints: [t('exercises.whenIsAndTrue.hints.1')],
        explanation: t('exercises.whenIsAndTrue.explanation'),
        options: [
          { id: 'one', label: t('exercises.whenIsAndTrue.options.one') },
          { id: 'exactly', label: t('exercises.whenIsAndTrue.options.exactly') },
          { id: 'both', label: t('exercises.whenIsAndTrue.options.both') },
          { id: 'neither', label: t('exercises.whenIsAndTrue.options.neither') },
        ],
        correctOptionId: 'both',
        misconceptions: {
          one: t('exercises.whenIsAndTrue.misconceptions.one'),
          exactly: t('exercises.whenIsAndTrue.misconceptions.exactly'),
          neither: t('exercises.whenIsAndTrue.misconceptions.neither'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'predict-or',
      phase: 'guided',
      exercise: {
        id: exerciseId('l05-predict-or'),
        kind: 'prediction',
        prompt: t('exercises.predictOr.prompt'),
        concept: C.booleanLogic,
        dimension: 'application',
        hints: [t('exercises.predictOr.hints.1')],
        explanation: t('exercises.predictOr.explanation'),
        code: { source: code('x = 3', 'outside = x < 5 or x > 10') },
        target: { kind: 'variable', name: 'outside' },
        expected: 'true',
        commonMistakes: {
          false: t('exercises.predictOr.mistakes.m1'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'predict-not',
      phase: 'guided',
      exercise: {
        id: exerciseId('l05-predict-not'),
        kind: 'prediction',
        prompt: t('exercises.predictNot.prompt'),
        concept: C.booleanLogic,
        dimension: 'application',
        hints: [t('exercises.predictNot.hints.1')],
        explanation: t('exercises.predictNot.explanation'),
        code: { source: code('n = 8', 'small = not n > 10') },
        target: { kind: 'variable', name: 'small' },
        expected: 'true',
        commonMistakes: {
          false: t('exercises.predictNot.mistakes.m1'),
        },
      },
    },
    {
      kind: 'explain',
      id: 'translate',
      title: t('steps.translate.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.translate.blocks.b1'),
        },
        {
          kind: 'code',
          caption: t('steps.translate.blocks.b2'),
          source: code('free = age < 5 or age > 65'),
        },
        {
          kind: 'callout',
          tone: 'tip',
          text: t('steps.translate.blocks.b3'),
        },
        {
          kind: 'callout',
          tone: 'key',
          text: t('steps.translate.blocks.b4'),
        },
      ],
    },
    {
      kind: 'exercise',
      id: 'complete-comfort',
      phase: 'practice',
      exercise: {
        id: exerciseId('l05-complete-comfortable'),
        kind: 'code-completion',
        prompt: t('exercises.completeComfortable.prompt'),
        concept: C.booleanLogic,
        dimension: 'application',
        hints: [t('exercises.completeComfortable.hints.1')],
        explanation: t('exercises.completeComfortable.explanation'),
        template: code('temp = 30', 'comfortable = temp >= 18 [[join]] temp [[upper]] 24'),
        blanks: [
          { id: 'join', options: ['and', 'or'], correct: 'and' },
          { id: 'upper', options: ['>=', '<='], correct: '<=' },
        ],
        check: { variable: 'comfortable', expected: 'false' },
        misconceptions: {
          'join:or': t('exercises.completeComfortable.misconceptions.m1'),
          'upper:>=': t('exercises.completeComfortable.misconceptions.m2'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'build-price',
      phase: 'practice',
      exercise: {
        id: exerciseId('l05-build-ticket-price'),
        kind: 'block-builder',
        prompt: t('exercises.buildTicketPrice.prompt'),
        concept: C.booleanLogic,
        dimension: 'application',
        hints: [t('exercises.buildTicketPrice.hints.1')],
        explanation: t('exercises.buildTicketPrice.explanation'),
        blocks: [
          { id: 'ask', label: 'if age < 5 or age > 65:' },
          { id: 'free', label: '    price = 0' },
          { id: 'else', label: 'else:' },
          { id: 'pay', label: '    price = 8' },
          { id: 'and', label: 'if age < 5 and age > 65:' },
          { id: 'flipped', label: 'if age > 5 or age < 65:' },
        ],
        solution: ['ask', 'free', 'else', 'pay'],
        misconceptions: {
          and: t('exercises.buildTicketPrice.misconceptions.and'),
          flipped: t('exercises.buildTicketPrice.misconceptions.flipped'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'match-rules',
      phase: 'practice',
      exercise: {
        id: exerciseId('l05-match-rules'),
        kind: 'matching',
        prompt: t('exercises.matchRules.prompt'),
        concept: C.booleanLogic,
        dimension: 'understanding',
        hints: [t('exercises.matchRules.hints.1')],
        explanation: t('exercises.matchRules.explanation'),
        pairs: [
          {
            left: { id: 'teen', label: t('exercises.matchRules.pairs.teen') },
            right: { id: 'range', label: '`age >= 13 and age <= 19`' },
          },
          {
            left: { id: 'free', label: t('exercises.matchRules.pairs.free') },
            right: { id: 'either', label: '`age < 5 or age > 65`' },
          },
          {
            left: { id: 'notboth', label: t('exercises.matchRules.pairs.notboth') },
            right: { id: 'notand', label: '`not (raining and cold)`' },
          },
          {
            left: { id: 'adultticket', label: t('exercises.matchRules.pairs.adultticket') },
            right: { id: 'both', label: '`age >= 18 and has_ticket`' },
          },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'debug-weekend',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l05-debug-weekend'),
        kind: 'debugging',
        prompt: t('exercises.debugWeekend.prompt'),
        concept: C.booleanLogic,
        dimension: 'debugging',
        hints: [],
        explanation: t('exercises.debugWeekend.explanation'),
        code: {
          source: code(
            'day = 7',
            'if day == 6 and day == 7:',
            '    status = "closed"',
            'else:',
            '    status = "open"',
          ),
        },
        bugLine: 2,
        causes: [
          { id: 'boundary', label: t('exercises.debugWeekend.causes.boundary') },
          { id: 'never', label: t('exercises.debugWeekend.causes.never') },
          { id: 'else', label: t('exercises.debugWeekend.causes.else') },
        ],
        correctCauseId: 'never',
        misconceptions: {
          boundary: t('exercises.debugWeekend.misconceptions.boundary'),
          else: t('exercises.debugWeekend.misconceptions.else'),
        },
        fix: {
          source: code(
            'day = 7',
            'if day == 6 or day == 7:',
            '    status = "closed"',
            'else:',
            '    status = "open"',
          ),
          variable: 'status',
          expected: '"closed"',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'de-morgan',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l05-not-both'),
        kind: 'multiple-choice',
        prompt: t('exercises.notBoth.prompt'),
        concept: C.booleanLogic,
        dimension: 'understanding',
        hints: [],
        explanation: t('exercises.notBoth.explanation'),
        options: [
          { id: 'andnot', label: '`not hungry and not tired`' },
          { id: 'ornot', label: '`not hungry or not tired`' },
          { id: 'or', label: '`hungry or tired`' },
        ],
        correctOptionId: 'ornot',
        misconceptions: {
          andnot: t('exercises.notBoth.misconceptions.andnot'),
          or: t('exercises.notBoth.misconceptions.or'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'predict-price',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l05-predict-price'),
        kind: 'prediction',
        prompt: t('exercises.predictPrice.prompt'),
        concept: C.booleanLogic,
        dimension: 'application',
        hints: [],
        explanation: t('exercises.predictPrice.explanation'),
        code: {
          source: code(
            'age = 70',
            'member = false',
            'if age < 12 or member:',
            '    price = 5',
            'elif age >= 65 and not member:',
            '    price = 7',
            'else:',
            '    price = 10',
          ),
        },
        target: { kind: 'variable', name: 'price' },
        expected: '7',
        commonMistakes: {
          '10': t('exercises.predictPrice.mistakes.m1'),
          '5': t('exercises.predictPrice.mistakes.m2'),
        },
      },
    },
  ],
};
