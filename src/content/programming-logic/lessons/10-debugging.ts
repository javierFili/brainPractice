import { exerciseId, lessonId, type Lesson } from '@/domain/learning';
import { msg } from '@/domain/shared/text';
import { C } from '../concepts';

const t = (key: string) => msg(`lessons:debugging.${key}`);

export const lesson: Lesson = {
  id: lessonId('debugging'),
  title: t('title'),
  objective: t('objective'),
  summary: t('summary'),
  minutes: 14,
  concepts: [C.debugging],
  keyPoints: [t('keyPoints.1'), t('keyPoints.2'), t('keyPoints.3'), t('keyPoints.4')],
  steps: [
    {
      kind: 'explain',
      id: 'method',
      title: t('steps.method.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.method.blocks.p1'),
        },
        {
          kind: 'list',
          items: [
            t('steps.method.blocks.list1.1'),
            t('steps.method.blocks.list1.2'),
            t('steps.method.blocks.list1.3'),
            t('steps.method.blocks.list1.4'),
            t('steps.method.blocks.list1.5'),
          ],
        },
        {
          kind: 'callout',
          tone: 'key',
          text: t('steps.method.blocks.callout1'),
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-trace',
      title: t('steps.play-trace.title'),
      intro: t('steps.play-trace.intro'),
      playground: {
        inputs: [{ name: 'n', type: 'number', initial: 3, min: 1, max: 10 }],
        source:
          'total = 0\nfor i in range(1, n):\n    total = total + i\nprint("sum 1 to", n, "is", total)',
        watch: ['i', 'total'],
        prompts: [
          t('steps.play-trace.prompts.1'),
          t('steps.play-trace.prompts.2'),
          t('steps.play-trace.prompts.3'),
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'order-method',
      phase: 'guided',
      exercise: {
        id: exerciseId('l10-order-method'),
        kind: 'ordering',
        prompt: t('exercises.order-method.prompt'),
        concept: C.debugging,
        dimension: 'understanding',
        hints: [t('exercises.order-method.hints.1'), t('exercises.order-method.hints.2')],
        explanation: t('exercises.order-method.explanation'),
        items: [
          { id: 'reproduce', label: t('exercises.order-method.items.reproduce') },
          { id: 'read', label: t('exercises.order-method.items.read') },
          { id: 'trace', label: t('exercises.order-method.items.trace') },
          { id: 'hypothesis', label: t('exercises.order-method.items.hypothesis') },
          { id: 'change', label: t('exercises.order-method.items.change') },
          { id: 'retest', label: t('exercises.order-method.items.retest') },
        ],
      },
    },
    {
      kind: 'exercise',
      id: 'debug-off-by-one',
      phase: 'guided',
      exercise: {
        id: exerciseId('l10-debug-off-by-one'),
        kind: 'debugging',
        prompt: t('exercises.debug-off-by-one.prompt'),
        concept: C.debugging,
        dimension: 'debugging',
        hints: [t('exercises.debug-off-by-one.hints.1'), t('exercises.debug-off-by-one.hints.2')],
        explanation: t('exercises.debug-off-by-one.explanation'),
        code: {
          source: 'n = 4\ntotal = 0\ni = 1\nwhile i < n:\n    total = total + i\n    i = i + 1',
        },
        bugLine: 4,
        causes: [
          {
            id: 'boundary',
            label: t('exercises.debug-off-by-one.causes.boundary'),
          },
          { id: 'start', label: t('exercises.debug-off-by-one.causes.start') },
          { id: 'overwrite', label: t('exercises.debug-off-by-one.causes.overwrite') },
          { id: 'step', label: t('exercises.debug-off-by-one.causes.step') },
        ],
        correctCauseId: 'boundary',
        misconceptions: {
          start: t('exercises.debug-off-by-one.misconceptions.start'),
          overwrite: t('exercises.debug-off-by-one.misconceptions.overwrite'),
          step: t('exercises.debug-off-by-one.misconceptions.step'),
        },
        fix: {
          source: 'n = 4\ntotal = 0\ni = 1\nwhile i <= n:\n    total = total + i\n    i = i + 1',
          variable: 'total',
          expected: '10',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'hypothesis',
      phase: 'guided',
      exercise: {
        id: exerciseId('l10-test-hypothesis'),
        kind: 'multiple-choice',
        prompt: t('exercises.test-hypothesis.prompt'),
        concept: C.debugging,
        dimension: 'application',
        hints: [t('exercises.test-hypothesis.hints.1')],
        explanation: t('exercises.test-hypothesis.explanation'),
        options: [
          { id: 'rewrite', label: t('exercises.test-hypothesis.options.rewrite') },
          { id: 'many', label: t('exercises.test-hypothesis.options.many') },
          { id: 'trace', label: t('exercises.test-hypothesis.options.trace') },
          { id: 'rerun', label: t('exercises.test-hypothesis.options.rerun') },
        ],
        correctOptionId: 'trace',
        misconceptions: {
          rewrite: t('exercises.test-hypothesis.misconceptions.rewrite'),
          many: t('exercises.test-hypothesis.misconceptions.many'),
          rerun: t('exercises.test-hypothesis.misconceptions.rerun'),
        },
      },
    },
    {
      kind: 'explain',
      id: 'families',
      title: t('steps.families.title'),
      blocks: [
        {
          kind: 'paragraph',
          text: t('steps.families.blocks.p1'),
        },
        {
          kind: 'list',
          items: [
            t('steps.families.blocks.list1.1'),
            t('steps.families.blocks.list1.2'),
            t('steps.families.blocks.list1.3'),
            t('steps.families.blocks.list1.4'),
            t('steps.families.blocks.list1.5'),
            t('steps.families.blocks.list1.6'),
          ],
        },
        {
          kind: 'callout',
          tone: 'warning',
          text: t('steps.families.blocks.callout1'),
        },
      ],
    },
    {
      kind: 'playground',
      id: 'play-error',
      title: t('steps.play-error.title'),
      intro: t('steps.play-error.intro'),
      playground: {
        inputs: [
          { name: 'score', type: 'number', initial: 42, min: 0, max: 100 },
          { name: 'useStr', type: 'boolean', initial: true },
        ],
        source:
          'if useStr:\n    label = "Score: " + str(score)\nelse:\n    label = "Score: " + score\nprint(label)',
        prompts: [t('steps.play-error.prompts.1'), t('steps.play-error.prompts.2')],
      },
    },
    {
      kind: 'exercise',
      id: 'debug-overwrite',
      phase: 'practice',
      exercise: {
        id: exerciseId('l10-debug-overwrite'),
        kind: 'debugging',
        prompt: t('exercises.debug-overwrite.prompt'),
        concept: C.debugging,
        dimension: 'debugging',
        hints: [t('exercises.debug-overwrite.hints.1')],
        explanation: t('exercises.debug-overwrite.explanation'),
        code: { source: 'prices = [4, 6, 5]\ntotal = 0\nfor p in prices:\n    total = p' },
        bugLine: 4,
        causes: [
          { id: 'start', label: t('exercises.debug-overwrite.causes.start') },
          { id: 'overwrite', label: t('exercises.debug-overwrite.causes.overwrite') },
          { id: 'loop', label: t('exercises.debug-overwrite.causes.loop') },
        ],
        correctCauseId: 'overwrite',
        misconceptions: {
          start: t('exercises.debug-overwrite.misconceptions.start'),
          loop: t('exercises.debug-overwrite.misconceptions.loop'),
        },
        fix: {
          source: 'prices = [4, 6, 5]\ntotal = 0\nfor p in prices:\n    total = total + p',
          variable: 'total',
          expected: '15',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-return',
      phase: 'practice',
      exercise: {
        id: exerciseId('l10-debug-return'),
        kind: 'debugging',
        prompt: t('exercises.debug-return.prompt'),
        concept: C.debugging,
        dimension: 'debugging',
        hints: [t('exercises.debug-return.hints.1'), t('exercises.debug-return.hints.2')],
        explanation: t('exercises.debug-return.explanation'),
        code: {
          source:
            'function count_even(numbers):\n    count = 0\n    for n in numbers:\n        if n % 2 == 0:\n            count = count + 1\n        return count\nresult = count_even([2, 4, 5, 6])',
        },
        bugLine: 6,
        causes: [
          { id: 'test', label: t('exercises.debug-return.causes.test') },
          { id: 'reset', label: t('exercises.debug-return.causes.reset') },
          {
            id: 'return',
            label: t('exercises.debug-return.causes.return'),
          },
          { id: 'local', label: t('exercises.debug-return.causes.local') },
        ],
        correctCauseId: 'return',
        misconceptions: {
          test: t('exercises.debug-return.misconceptions.test'),
          reset: t('exercises.debug-return.misconceptions.reset'),
          local: t('exercises.debug-return.misconceptions.local'),
        },
        fix: {
          source:
            'function count_even(numbers):\n    count = 0\n    for n in numbers:\n        if n % 2 == 0:\n            count = count + 1\n    return count\nresult = count_even([2, 4, 5, 6])',
          variable: 'result',
          expected: '3',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'trace-wrong-var',
      phase: 'practice',
      exercise: {
        id: exerciseId('l10-trace-wrong-variable'),
        kind: 'prediction',
        prompt: t('exercises.trace-wrong-variable.prompt'),
        concept: C.debugging,
        dimension: 'application',
        hints: [
          t('exercises.trace-wrong-variable.hints.1'),
          t('exercises.trace-wrong-variable.hints.2'),
        ],
        explanation: t('exercises.trace-wrong-variable.explanation'),
        code: {
          source:
            'count = 0\ntotal = 0\nfor x in [2, 3, 4]:\n    total = total + x\n    count = total + 1',
          highlight: [5],
        },
        target: { kind: 'variable', name: 'count' },
        expected: '10',
        commonMistakes: {
          '3': t('exercises.trace-wrong-variable.commonMistakes.3'),
          '9': t('exercises.trace-wrong-variable.commonMistakes.9'),
          '4': t('exercises.trace-wrong-variable.commonMistakes.4'),
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-endless',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l10-debug-endless-loop'),
        kind: 'debugging',
        prompt: t('exercises.debug-endless-loop.prompt'),
        concept: C.debugging,
        dimension: 'debugging',
        hints: [],
        explanation: t('exercises.debug-endless-loop.explanation'),
        code: { source: 'n = 10\nsteps = 0\nwhile n > 0:\n    steps = steps + 1\n    n = n + 2' },
        bugLine: 5,
        causes: [
          { id: 'condition', label: t('exercises.debug-endless-loop.causes.condition') },
          { id: 'away', label: t('exercises.debug-endless-loop.causes.away') },
          { id: 'steps', label: t('exercises.debug-endless-loop.causes.steps') },
          { id: 'limit', label: t('exercises.debug-endless-loop.causes.limit') },
        ],
        correctCauseId: 'away',
        misconceptions: {
          condition: t('exercises.debug-endless-loop.misconceptions.condition'),
          steps: t('exercises.debug-endless-loop.misconceptions.steps'),
          limit: t('exercises.debug-endless-loop.misconceptions.limit'),
        },
        fix: {
          source: 'n = 10\nsteps = 0\nwhile n > 0:\n    steps = steps + 1\n    n = n - 2',
          variable: 'steps',
          expected: '5',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'debug-index',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l10-debug-last-index'),
        kind: 'debugging',
        prompt: t('exercises.debug-last-index.prompt'),
        concept: C.debugging,
        dimension: 'debugging',
        hints: [],
        explanation: t('exercises.debug-last-index.explanation'),
        code: { source: 'names = ["Ana", "Ben", "Cai"]\nlast = names[len(names)]' },
        bugLine: 2,
        causes: [
          { id: 'short', label: t('exercises.debug-last-index.causes.short') },
          { id: 'len', label: t('exercises.debug-last-index.causes.len') },
          { id: 'zero', label: t('exercises.debug-last-index.causes.zero') },
        ],
        correctCauseId: 'zero',
        misconceptions: {
          short: t('exercises.debug-last-index.misconceptions.short'),
          len: t('exercises.debug-last-index.misconceptions.len'),
        },
        fix: {
          source: 'names = ["Ana", "Ben", "Cai"]\nlast = names[len(names) - 1]',
          variable: 'last',
          expected: '"Cai"',
        },
      },
    },
    {
      kind: 'exercise',
      id: 'match-families',
      phase: 'checkpoint',
      exercise: {
        id: exerciseId('l10-match-families'),
        kind: 'matching',
        prompt: t('exercises.match-families.prompt'),
        concept: C.debugging,
        dimension: 'understanding',
        hints: [],
        explanation: t('exercises.match-families.explanation'),
        pairs: [
          {
            left: { id: 'limit', label: t('exercises.match-families.pairs.limit') },
            right: { id: 'endless', label: t('exercises.match-families.pairs.endless') },
          },
          {
            left: { id: 'last', label: t('exercises.match-families.pairs.last') },
            right: { id: 'overwrite', label: t('exercises.match-families.pairs.overwrite') },
          },
          {
            left: { id: 'sum', label: t('exercises.match-families.pairs.sum') },
            right: { id: 'offbyone', label: t('exercises.match-families.pairs.offbyone') },
          },
          {
            left: { id: 'type', label: t('exercises.match-families.pairs.type') },
            right: { id: 'str', label: t('exercises.match-families.pairs.str') },
          },
          {
            left: { id: 'unset', label: t('exercises.match-families.pairs.unset') },
            right: { id: 'init', label: t('exercises.match-families.pairs.init') },
          },
        ],
      },
    },
  ],
};
